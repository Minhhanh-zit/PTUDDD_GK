import {
  getSyncDatabase, getCategories, getDishes, getDishDetail,
} from '../database/database';
import {
  getOnlineCategories, getOnlineDishes,
  createOnlineCategory, updateOnlineCategory, deleteOnlineCategory,
  createOnlineDish, updateOnlineDish, deleteOnlineDish,
} from './mockApi';

// Chay tu dong trong foreground: ban offline van luu SQLite; khi co mang lai se retry.
// Dirty local > remote trong luc co xung dot; remote -> local neu ban ghi local da clean.
const P = 'BIT246755_';
const CAT = P + 'DishCategory';
const DISH = P + 'Dish';
const IMAGE = P + 'DishImage';
const STATE = P + 'SyncState';

const normalize = v => String(v ?? '').trim().toLocaleLowerCase();
const numberId = v => Number(v);
const remoteId = r => r && r.id != null ? String(r.id) : null;
const readValue = (record, key, fallback) => record[P + key] ?? fallback;
const booleanValue = v => v === true || v === 1 || v === '1' || v === 'true';
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

let activePromise = null;

function parseImages(raw) {
  let value = raw;
  if (typeof value === 'string') {
    try { value = JSON.parse(value); } catch { return null; }
  }
  if (!Array.isArray(value)) return null;
  const mapped = value
    .map(i => ({
      imageUrl: String(i?.[P + 'ImageUrl'] ?? i?.imageUrl ?? '').trim(),
      isThumbnail: booleanValue(i?.[P + 'IsThumbnail'] ?? i?.isThumbnail),
    }))
    .filter(i => /^https?:\/\//i.test(i.imageUrl));
  let seen = false;
  return mapped.map((i, index) => {
    const isThumbnail = i.isThumbnail && !seen;
    if (isThumbnail) seen = true;
    return { imageUrl: i.imageUrl, isThumbnail: isThumbnail || (!seen && index === 0) };
  });
}

async function ensureTracked(db) {
  await db.execAsync(`
    INSERT OR IGNORE INTO "${STATE}"
      ("BIT246755_Entity","BIT246755_LocalId","BIT246755_Pending","BIT246755_Revision")
    SELECT 'category', "BIT246755_Id", 1, 1 FROM "${CAT}";
    INSERT OR IGNORE INTO "${STATE}"
      ("BIT246755_Entity","BIT246755_LocalId","BIT246755_Pending","BIT246755_Revision")
    SELECT 'dish', "BIT246755_Id", 1, 1 FROM "${DISH}";
  `);
}

async function states(db, entity, onlyPending = false) {
  return db.getAllAsync(`SELECT "BIT246755_LocalId" AS localId,
    "BIT246755_RemoteId" AS remoteId,
    "BIT246755_Pending" AS pending,
    "BIT246755_Deleted" AS deleted,
    "BIT246755_Revision" AS revision
    FROM "${STATE}" WHERE "BIT246755_Entity"=?
    ${onlyPending ? 'AND "BIT246755_Pending"=1' : ''}
    ORDER BY "BIT246755_LocalId"`, [entity]);
}

async function matchRemoteIds(db, entity, remoteRecords) {
  const local = entity === 'category' ? await getCategories() : await getDishes();
  const sync = await states(db, entity);
  const claimed = new Set(sync.filter(s => s.remoteId).map(s => String(s.remoteId)));
  for (const row of local) {
    const state = sync.find(s => s.localId === row.id);
    if (!state || state.remoteId || state.deleted) continue;
    const choices = remoteRecords.filter(r => remoteId(r) && !claimed.has(remoteId(r)));
    // Truoc tien tim bang ten (va loai voi mon), sau do ID du lieu mau.
    let matched = choices.find(r => normalize(readValue(r, 'Name', '')) === normalize(row.name)
      && (entity === 'category' || Number(readValue(r, 'DishCategoryId', -1)) === row.categoryId));
    if (!matched) {
      matched = choices.find(r => Number(readValue(r, 'Id', -1)) === row.id);
    }
    if (!matched) continue;
    try {
      await db.runAsync(`UPDATE "${STATE}" SET "BIT246755_RemoteId"=?
        WHERE "BIT246755_Entity"=? AND "BIT246755_LocalId"=?
          AND "BIT246755_RemoteId" IS NULL`,
        [remoteId(matched), entity, row.id]);
      claimed.add(remoteId(matched));
    } catch (e) {
      console.warn('Cannot map remote ID:', e.message);
    }
  }
}

function categoryPayload(c) {
  return {
    BIT246755_Id: c.id,
    BIT246755_Name: c.name,
    BIT246755_Description: c.description || '',
  };
}
function dishPayload(d) {
  return {
    BIT246755_Id: d.id,
    BIT246755_Name: d.name,
    BIT246755_Price: d.price,
    BIT246755_PreparationTime: d.preparationTime,
    BIT246755_IsAvailable: Boolean(d.isAvailable),
    BIT246755_Description: d.description || '',
    BIT246755_DishCategoryId: d.categoryId,
    BIT246755_DishImage: (d.images || []).map(i => ({
      BIT246755_ImageUrl: i.imageUrl,
      BIT246755_IsThumbnail: Boolean(i.isThumbnail),
    })),
  };
}

async function clearVersion(db, entity, state, newRemoteId) {
  await db.runAsync(`UPDATE "${STATE}"
    SET "BIT246755_RemoteId"=COALESCE(?, "BIT246755_RemoteId"),
        "BIT246755_Pending"=CASE WHEN "BIT246755_Revision"=? THEN 0 ELSE "BIT246755_Pending" END
    WHERE "BIT246755_Entity"=? AND "BIT246755_LocalId"=?`,
    [newRemoteId, state.revision, entity, state.localId]);
}

async function upload(db, entity, deleted) {
  const queue = (await states(db, entity, true)).filter(s => Boolean(s.deleted) === deleted);
  for (const state of queue) {
    if (deleted) {
      if (state.remoteId) {
        try {
          if (entity === 'category') await deleteOnlineCategory(state.remoteId);
          else await deleteOnlineDish(state.remoteId);
        } catch (e) {
          // Neu da xoa online truoc do nhung mat phan hoi, 404 van la thanh cong.
          if (!String(e.message).includes('404')) throw e;
        }
      }
      await db.runAsync(`DELETE FROM "${STATE}" WHERE "BIT246755_Entity"=?
        AND "BIT246755_LocalId"=? AND "BIT246755_Revision"=?
        AND "BIT246755_Deleted"=1`,
        [entity, state.localId, state.revision]);
      continue;
    }
    let row;
    if (entity === 'category') {
      row = (await getCategories()).find(c => c.id === state.localId);
    } else {
      row = await getDishDetail(state.localId);
    }
    if (!row) continue; // Ban ghi vua bi xoa, luot dong bo ke tiep xu ly tombstone.
    const payload = entity === 'category' ? categoryPayload(row) : dishPayload(row);
    const saved = entity === 'category'
      ? (state.remoteId ? await updateOnlineCategory(state.remoteId, payload) : await createOnlineCategory(payload))
      : (state.remoteId ? await updateOnlineDish(state.remoteId, payload) : await createOnlineDish(payload));
    if (!remoteId(saved)) throw new Error('MockAPI returned no id; sync paused');
    await clearVersion(db, entity, state, remoteId(saved));
  }
}

async function upsertCategory(db, r) {
  const rid = remoteId(r);
  const name = String(readValue(r, 'Name', '')).trim();
  if (!rid || !name) return { changed: false, localId: null };
  const description = String(readValue(r, 'Description', ''));
  return db.withExclusiveTransactionAsync(async tx => {
    const mapped = await tx.getFirstAsync(`SELECT "BIT246755_LocalId" AS id,
      "BIT246755_Pending" AS pending, "BIT246755_Deleted" AS deleted
      FROM "${STATE}" WHERE "BIT246755_Entity"='category'
      AND "BIT246755_RemoteId"=?`, [rid]);
    if (mapped) {
      if (mapped.pending || mapped.deleted) return { changed: false, localId: mapped.id };
      const old = await tx.getFirstAsync(`SELECT "BIT246755_Name" AS name,
        "BIT246755_Description" AS description FROM "${CAT}"
        WHERE "BIT246755_Id"=?`, [mapped.id]);
      if (!old) return { changed: false, localId: null };
      if (old.name === name && old.description === description) return { changed: false, localId: mapped.id };
      await tx.runAsync(`UPDATE "${CAT}" SET
        "BIT246755_Name"=?, "BIT246755_Description"=?
        WHERE "BIT246755_Id"=?`, [name, description, mapped.id]);
      return { changed: true, localId: mapped.id };
    }
    // Co ban ghi local trung ten: ket noi vao remote, khong tao dong thu hai.
    const existing = await tx.getFirstAsync(`SELECT "BIT246755_Id" AS id FROM "${CAT}"
      WHERE lower(trim("BIT246755_Name"))=lower(trim(?))`, [name]);
    if (existing) {
      const has = await tx.getFirstAsync(`SELECT "BIT246755_RemoteId" AS rid
        FROM "${STATE}" WHERE "BIT246755_Entity"='category'
        AND "BIT246755_LocalId"=?`, [existing.id]);
      if (has?.rid) return { changed: false, localId: existing.id };
      await tx.runAsync(`INSERT INTO "${STATE}"
        ("BIT246755_Entity","BIT246755_LocalId","BIT246755_RemoteId",
         "BIT246755_Pending","BIT246755_Deleted","BIT246755_Revision")
        VALUES ('category',?,?,0,0,0)
        ON CONFLICT ("BIT246755_Entity","BIT246755_LocalId")
        DO UPDATE SET "BIT246755_RemoteId"=excluded."BIT246755_RemoteId"`,
        [existing.id, rid]);
      return { changed: false, localId: existing.id };
    }
    const ins = await tx.runAsync(`INSERT INTO "${CAT}"
      ("BIT246755_Name","BIT246755_Description") VALUES (?,?)`, [name, description]);
    await tx.runAsync(`INSERT INTO "${STATE}"
      ("BIT246755_Entity","BIT246755_LocalId","BIT246755_RemoteId",
       "BIT246755_Pending","BIT246755_Deleted","BIT246755_Revision")
      VALUES ('category',?,?,0,0,0)`, [ins.lastInsertRowId, rid]);
    return { changed: true, localId: ins.lastInsertRowId };
  });
}

async function upsertDish(db, r, remoteCategories) {
  const rid = remoteId(r);
  const name = String(readValue(r, 'Name', '')).trim();
  const extCategoryId = numberId(readValue(r, 'DishCategoryId', 0));
  const remoteCat = remoteCategories.find(c => numberId(readValue(c, 'Id', 0)) === extCategoryId)
    || remoteCategories.find(c => numberId(c.id) === extCategoryId);
  if (!rid || !name || !remoteCat) return false;

  const mappedCategory = await db.getFirstAsync(`SELECT "BIT246755_LocalId" AS id
    FROM "${STATE}" WHERE "BIT246755_Entity"='category'
      AND "BIT246755_RemoteId"=? AND "BIT246755_Deleted"=0`, [remoteId(remoteCat)]);
  if (!mappedCategory) return false;

  const price = Number(readValue(r, 'Price', 0));
  const time = Number(readValue(r, 'PreparationTime', 0));
  if (!(price > 0) || !Number.isInteger(time) || time <= 0) return false;
  const available = booleanValue(readValue(r, 'IsAvailable', true)) ? 1 : 0;
  const description = String(readValue(r, 'Description', ''));
  const images = parseImages(readValue(r, 'DishImage', null));

  return db.withExclusiveTransactionAsync(async tx => {
    const mapped = await tx.getFirstAsync(`SELECT "BIT246755_LocalId" AS id,
      "BIT246755_Pending" AS pending, "BIT246755_Deleted" AS deleted
      FROM "${STATE}" WHERE "BIT246755_Entity"='dish'
      AND "BIT246755_RemoteId"=?`, [rid]);
    if (mapped && (mapped.pending || mapped.deleted)) return false;
    let id = mapped?.id;
    if (!id) {
      const existing = await tx.getFirstAsync(`SELECT "BIT246755_Id" AS id
        FROM "${DISH}" WHERE "BIT246755_DishCategoryId"=?
          AND lower(trim("BIT246755_Name"))=lower(trim(?))`, [mappedCategory.id, name]);
      if (existing) {
        const linked = await tx.getFirstAsync(`SELECT "BIT246755_RemoteId" AS rid
          FROM "${STATE}" WHERE "BIT246755_Entity"='dish'
          AND "BIT246755_LocalId"=?`, [existing.id]);
        if (linked?.rid) return false;
        id = existing.id;
        await tx.runAsync(`INSERT INTO "${STATE}"
          ("BIT246755_Entity","BIT246755_LocalId","BIT246755_RemoteId",
           "BIT246755_Pending","BIT246755_Deleted","BIT246755_Revision")
          VALUES ('dish',?,?,0,0,0)
          ON CONFLICT ("BIT246755_Entity","BIT246755_LocalId")
          DO UPDATE SET "BIT246755_RemoteId"=excluded."BIT246755_RemoteId"`, [id, rid]);
      } else {
        const ins = await tx.runAsync(`INSERT INTO "${DISH}" (
          "BIT246755_Name","BIT246755_Price","BIT246755_PreparationTime",
          "BIT246755_IsAvailable","BIT246755_Description","BIT246755_DishCategoryId"
        ) VALUES (?,?,?,?,?,?)`, [name,price,time,available,description,mappedCategory.id]);
        id = ins.lastInsertRowId;
        await tx.runAsync(`INSERT INTO "${STATE}" (
          "BIT246755_Entity","BIT246755_LocalId","BIT246755_RemoteId",
          "BIT246755_Pending","BIT246755_Deleted","BIT246755_Revision")
          VALUES ('dish',?,?,0,0,0)`, [id,rid]);
      }
    }
    const old = await tx.getFirstAsync(`SELECT "BIT246755_Name" AS name,
      "BIT246755_Price" AS price, "BIT246755_PreparationTime" AS prep,
      "BIT246755_IsAvailable" AS available, "BIT246755_Description" AS description,
      "BIT246755_DishCategoryId" AS categoryId
      FROM "${DISH}" WHERE "BIT246755_Id"=?`, [id]);
    if (!old) return false;
    let changed = old.name !== name || Number(old.price) !== price ||
      old.prep !== time || old.available !== available ||
      old.description !== description || old.categoryId !== mappedCategory.id;
    if (changed) {
      await tx.runAsync(`UPDATE "${DISH}" SET
        "BIT246755_Name"=?, "BIT246755_Price"=?, "BIT246755_PreparationTime"=?,
        "BIT246755_IsAvailable"=?, "BIT246755_Description"=?, "BIT246755_DishCategoryId"=?
        WHERE "BIT246755_Id"=?`,
        [name,price,time,available,description,mappedCategory.id,id]);
    }
    if (images !== null) {
      const oldImages = await tx.getAllAsync(`SELECT
        "BIT246755_ImageUrl" AS imageUrl,
        "BIT246755_IsThumbnail" AS isThumbnail FROM "${IMAGE}"
        WHERE "BIT246755_DishId"=? ORDER BY "BIT246755_Id"`, [id]);
      const comparable = items => items.map(i => [i.imageUrl, !!i.isThumbnail]);
      if (!same(comparable(oldImages), comparable(images))) {
        await tx.runAsync(`DELETE FROM "${IMAGE}" WHERE "BIT246755_DishId"=?`, [id]);
        for (const photo of images) {
          await tx.runAsync(`INSERT INTO "${IMAGE}" (
            "BIT246755_DishId","BIT246755_ImageUrl","BIT246755_IsThumbnail"
          ) VALUES (?,?,?)`, [id,photo.imageUrl, photo.isThumbnail ? 1 : 0]);
        }
        changed = true;
      }
    }
    return changed;
  });
}

async function removeMissingRemote(db, entity, existingRemoteIds) {
  const list = await states(db, entity);
  let count = 0;
  for (const state of list) {
    if (!state.remoteId || state.pending || state.deleted || existingRemoteIds.has(String(state.remoteId))) continue;
    try {
      await db.withExclusiveTransactionAsync(async tx => {
        const current = await tx.getFirstAsync(`SELECT
          "BIT246755_Pending" AS pending, "BIT246755_RemoteId" AS rid
          FROM "${STATE}" WHERE "BIT246755_Entity"=? AND "BIT246755_LocalId"=?`,
          [entity,state.localId]);
        if (!current || current.pending || current.rid !== state.remoteId) return;
        if (entity === 'category') {
          const used = await tx.getFirstAsync(`SELECT count(*) AS n FROM "${DISH}"
            WHERE "BIT246755_DishCategoryId"=?`, [state.localId]);
          if (used.n) return; // Bao ve FK neu van co mon tham chieu.
        }
        await tx.runAsync(`DELETE FROM "${entity === 'dish' ? DISH : CAT}"
          WHERE "BIT246755_Id"=?`, [state.localId]);
        await tx.runAsync(`DELETE FROM "${STATE}"
          WHERE "BIT246755_Entity"=? AND "BIT246755_LocalId"=?`, [entity,state.localId]);
        count++;
      });
    } catch (e) { console.warn('Cannot delete old remote item locally:', e.message); }
  }
  return count;
}

async function pendingCount(db) {
  const result = await db.getFirstAsync(`SELECT COUNT(*) AS n FROM "${STATE}"
    WHERE "BIT246755_Pending"=1`);
  return result?.n || 0;
}

async function performSync() {
  const db = await getSyncDatabase();
  try {
    // GET truoc khi ghi: neu offline/HTTP loi thi khong ghi sai cloud.
    let [remoteCats, remoteDishes] = await Promise.all([
      getOnlineCategories(), getOnlineDishes(),
    ]);
    if (!Array.isArray(remoteCats) || !Array.isArray(remoteDishes)) {
      throw new Error('MockAPI did not return arrays');
    }
    await ensureTracked(db);
    await matchRemoteIds(db, 'category', remoteCats);
    await upload(db, 'category', false);

    // Category phai co truoc Dish de giu quan he.
    remoteCats = await getOnlineCategories();
    await matchRemoteIds(db, 'dish', remoteDishes);
    await upload(db, 'dish', false);
    await upload(db, 'dish', true);
    await upload(db, 'category', true);

    [remoteCats, remoteDishes] = await Promise.all([
      getOnlineCategories(), getOnlineDishes(),
    ]);
    let changed = 0;
    for (const row of remoteCats) {
      try { if ((await upsertCategory(db, row)).changed) changed++; }
      catch (e) { console.warn('Skip conflicting remote category:', e.message); }
    }
    for (const row of remoteDishes) {
      try { if (await upsertDish(db, row, remoteCats)) changed++; }
      catch (e) { console.warn('Skip conflicting remote dish:', e.message); }
    }
    changed += await removeMissingRemote(db, 'dish', new Set(remoteDishes.map(remoteId)));
    changed += await removeMissingRemote(db, 'category', new Set(remoteCats.map(remoteId)));
    return { phase: 'online', pending: await pendingCount(db), changed, error: '' };
  } catch (e) {
    console.warn('Food Manager sync:', e.message);
    const message = String(e.message || e);
    const offline = /network|fetch|abort|timed out|internet/i.test(message);
    return { phase: offline ? 'offline' : 'error', pending: await pendingCount(db),
      changed: 0, error: message };
  }
}

export async function syncNow() {
  if (activePromise) return activePromise;
  activePromise = performSync();
  try { return await activePromise; }
  finally { activePromise = null; }
}
