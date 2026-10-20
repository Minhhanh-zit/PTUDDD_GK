import * as SQLite from 'expo-sqlite';

// Tat ca TABLE/COLUMN co tien to MSSV theo de thi.
const DB_NAME = 'BIT246755_FoodManager.db';
const T = { category: 'BIT246755_DishCategory', dish: 'BIT246755_Dish', image: 'BIT246755_DishImage', setting: 'BIT246755_AppSetting' };
let databasePromise;
const openDb = () => {
  if (!databasePromise) databasePromise = SQLite.openDatabaseAsync(DB_NAME);
  return databasePromise;
};

// Thay doi local -> tu dong kich hoat kiem tra dong bo.
const localChangeListeners = new Set();
export function subscribeLocalChanges(listener) {
  localChangeListeners.add(listener);
  return () => localChangeListeners.delete(listener);
}
function notifyLocalChange() {
  for (const listener of localChangeListeners) {
    try { listener(); } catch (error) { console.warn('Sync listener:', error); }
  }
}
export async function getSyncDatabase() { return openDb(); }

// Ghi outbox ngay trong transaction CRUD, dam bao thay doi offline khong bi mat.
async function markDirty(tx, entity, id, deleted = false) {
  await tx.runAsync(`INSERT INTO "BIT246755_SyncState" (
    "BIT246755_Entity", "BIT246755_LocalId", "BIT246755_Pending",
    "BIT246755_Deleted", "BIT246755_Revision"
  ) VALUES (?, ?, 1, ?, 1)
  ON CONFLICT ("BIT246755_Entity", "BIT246755_LocalId") DO UPDATE SET
    "BIT246755_Pending" = 1,
    "BIT246755_Deleted" = excluded."BIT246755_Deleted",
    "BIT246755_Revision" = "BIT246755_Revision" + 1`,
    [entity, id, deleted ? 1 : 0]);
}

const photoSamples = {
  'Chicken Rice': [
    'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=900',
    'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=900',
  ],
  'Beef Noodles': ['https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=900'],
  'Orange Juice': ['https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=900'],
  'Iced Tea': ['https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=900'],
  'Chocolate Cake': ['https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=900'],
};

export async function initDatabase() {
  const db = await openDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS "${T.category}" (
      "BIT246755_Id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "BIT246755_Name" TEXT NOT NULL CHECK(length(trim("BIT246755_Name")) > 0),
      "BIT246755_Description" TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS "${T.dish}" (
      "BIT246755_Id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "BIT246755_Name" TEXT NOT NULL CHECK(length(trim("BIT246755_Name")) > 0),
      "BIT246755_Price" REAL NOT NULL CHECK("BIT246755_Price" > 0),
      "BIT246755_PreparationTime" INTEGER NOT NULL CHECK("BIT246755_PreparationTime" > 0),
      "BIT246755_IsAvailable" INTEGER NOT NULL DEFAULT 1 CHECK("BIT246755_IsAvailable" IN (0, 1)),
      "BIT246755_Description" TEXT NOT NULL DEFAULT '',
      "BIT246755_DishCategoryId" INTEGER NOT NULL,
      FOREIGN KEY ("BIT246755_DishCategoryId") REFERENCES "${T.category}"("BIT246755_Id") ON DELETE RESTRICT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "BIT246755_UniqueDishName"
      ON "${T.dish}" ("BIT246755_DishCategoryId", lower(trim("BIT246755_Name")));
    CREATE TABLE IF NOT EXISTS "${T.image}" (
      "BIT246755_Id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "BIT246755_DishId" INTEGER NOT NULL,
      "BIT246755_ImageUrl" TEXT NOT NULL CHECK(length(trim("BIT246755_ImageUrl")) > 0),
      "BIT246755_IsThumbnail" INTEGER NOT NULL DEFAULT 0 CHECK("BIT246755_IsThumbnail" IN (0, 1)),
      FOREIGN KEY ("BIT246755_DishId") REFERENCES "${T.dish}"("BIT246755_Id") ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "BIT246755_OneThumbnail"
      ON "${T.image}" ("BIT246755_DishId") WHERE "BIT246755_IsThumbnail" = 1;
    CREATE TABLE IF NOT EXISTS "${T.setting}" (
      "BIT246755_Key" TEXT PRIMARY KEY,
      "BIT246755_Value" TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "BIT246755_SyncState" (
      "BIT246755_Entity" TEXT NOT NULL CHECK ("BIT246755_Entity" IN ('category', 'dish')),
      "BIT246755_LocalId" INTEGER NOT NULL,
      "BIT246755_RemoteId" TEXT,
      "BIT246755_Pending" INTEGER NOT NULL DEFAULT 0,
      "BIT246755_Deleted" INTEGER NOT NULL DEFAULT 0,
      "BIT246755_Revision" INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY ("BIT246755_Entity", "BIT246755_LocalId")
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "BIT246755_SyncRemoteUnique"
      ON "BIT246755_SyncState" ("BIT246755_Entity", "BIT246755_RemoteId")
      WHERE "BIT246755_RemoteId" IS NOT NULL;
  `);

  await db.withExclusiveTransactionAsync(async (tx) => {
    const counts = await tx.getFirstAsync(`SELECT COUNT(*) AS total FROM "${T.category}"`);
    if (counts.total === 0) {
      const ids = [];
      for (const [name, description] of [
        ['Main Course', 'Main dishes'], ['Drinks', 'Beverages'], ['Desserts', 'Sweet dishes'],
      ]) {
        const r = await tx.runAsync(`INSERT INTO "${T.category}" ("BIT246755_Name", "BIT246755_Description") VALUES (?, ?)`, [name, description]);
        ids.push(r.lastInsertRowId);
      }
      for (const d of [
        ['Chicken Rice', 65000, 20, 1, 'Rice with chicken', 0],
        ['Beef Noodles', 75000, 25, 1, 'Beef noodle soup', 0],
        ['Orange Juice', 30000, 5, 1, 'Fresh orange juice', 1],
        ['Iced Tea', 15000, 5, 0, 'Refreshing iced tea', 1],
        ['Chocolate Cake', 45000, 10, 1, 'Chocolate dessert', 2],
      ]) {
        await tx.runAsync(`INSERT INTO "${T.dish}" (
            "BIT246755_Name", "BIT246755_Price", "BIT246755_PreparationTime",
            "BIT246755_IsAvailable", "BIT246755_Description", "BIT246755_DishCategoryId"
          ) VALUES (?, ?, ?, ?, ?, ?)`, [d[0], d[1], d[2], d[3], d[4], ids[d[5]]]);
      }
    }

    // Chi chay seed anh mau 1 lan; khong de anh bi tai tao sau khi nguoi dung xoa.
    const marker = await tx.getFirstAsync(`SELECT "BIT246755_Value" AS val FROM "${T.setting}" WHERE "BIT246755_Key" = ?`, ['initialPhotosV1']);
    if (!marker) {
      const existing = await tx.getAllAsync(`SELECT "BIT246755_Id" AS id, "BIT246755_Name" AS name FROM "${T.dish}"`);
      for (const row of existing) {
        const urls = photoSamples[row.name];
        if (!urls) continue;
        const c = await tx.getFirstAsync(`SELECT COUNT(*) AS n FROM "${T.image}" WHERE "BIT246755_DishId" = ?`, [row.id]);
        if (c.n > 0) continue;
        for (let i = 0; i < urls.length; i++) {
          await tx.runAsync(`INSERT INTO "${T.image}" ("BIT246755_DishId", "BIT246755_ImageUrl", "BIT246755_IsThumbnail") VALUES (?, ?, ?)`, [row.id, urls[i], i === 0 ? 1 : 0]);
        }
      }
      await tx.runAsync(`INSERT INTO "${T.setting}" ("BIT246755_Key", "BIT246755_Value") VALUES (?, ?)`, ['initialPhotosV1', 'yes']);
    }
  });
  return db;
}

export async function getCategories() {
  const db = await openDb();
  return db.getAllAsync(`SELECT "BIT246755_Id" AS id, "BIT246755_Name" AS name,
    "BIT246755_Description" AS description FROM "${T.category}" ORDER BY "BIT246755_Id"`);
}

export async function getDishes() {
  const db = await openDb();
  return db.getAllAsync(`
    SELECT d."BIT246755_Id" AS id, d."BIT246755_Name" AS name,
      d."BIT246755_Price" AS price, d."BIT246755_PreparationTime" AS preparationTime,
      d."BIT246755_IsAvailable" AS isAvailable, d."BIT246755_Description" AS description,
      d."BIT246755_DishCategoryId" AS categoryId, c."BIT246755_Name" AS categoryName,
      (SELECT i."BIT246755_ImageUrl" FROM "${T.image}" i
         WHERE i."BIT246755_DishId" = d."BIT246755_Id"
         ORDER BY i."BIT246755_IsThumbnail" DESC, i."BIT246755_Id" ASC LIMIT 1) AS imageUrl
    FROM "${T.dish}" d
    JOIN "${T.category}" c ON c."BIT246755_Id" = d."BIT246755_DishCategoryId"
    ORDER BY d."BIT246755_Id" DESC`);
}

export async function getDishDetail(id) {
  const db = await openDb();
  const dish = await db.getFirstAsync(`
    SELECT d."BIT246755_Id" AS id, d."BIT246755_Name" AS name,
      d."BIT246755_Price" AS price, d."BIT246755_PreparationTime" AS preparationTime,
      d."BIT246755_IsAvailable" AS isAvailable, d."BIT246755_Description" AS description,
      d."BIT246755_DishCategoryId" AS categoryId, c."BIT246755_Name" AS categoryName
    FROM "${T.dish}" d
    JOIN "${T.category}" c ON c."BIT246755_Id" = d."BIT246755_DishCategoryId"
    WHERE d."BIT246755_Id" = ?`, [id]);
  if (!dish) return null;
  const images = await db.getAllAsync(`SELECT "BIT246755_Id" AS id,
    "BIT246755_ImageUrl" AS imageUrl, "BIT246755_IsThumbnail" AS isThumbnail
    FROM "${T.image}" WHERE "BIT246755_DishId" = ?
    ORDER BY "BIT246755_IsThumbnail" DESC, "BIT246755_Id" ASC`, [id]);
  return { ...dish, images };
}

// Tra ve ID mon vua tao/sua. Validation thu hai la UNIQUE + FK trong SQLite.
export async function saveDish(data, editingId = null) {
  const db = await openDb();
  let resultId = editingId;
  await db.withExclusiveTransactionAsync(async (tx) => {
    const cat = await tx.getFirstAsync(`SELECT "BIT246755_Id" AS id FROM "${T.category}" WHERE "BIT246755_Id" = ?`, [data.categoryId]);
    if (!cat) throw new Error('missingCategory');
    const duplicate = await tx.getFirstAsync(`
      SELECT "BIT246755_Id" AS id FROM "${T.dish}"
      WHERE "BIT246755_DishCategoryId" = ? AND lower(trim("BIT246755_Name")) = lower(trim(?))
      AND (? IS NULL OR "BIT246755_Id" != ?) LIMIT 1`,
    [data.categoryId, data.name, editingId, editingId]);
    if (duplicate) throw new Error('duplicateDish');
    if (editingId != null) {
      const updated = await tx.runAsync(`UPDATE "${T.dish}" SET
        "BIT246755_Name"=?, "BIT246755_Price"=?, "BIT246755_PreparationTime"=?,
        "BIT246755_IsAvailable"=?, "BIT246755_Description"=?, "BIT246755_DishCategoryId"=?
        WHERE "BIT246755_Id"=?`,
      [data.name, data.price, data.preparationTime, data.isAvailable ? 1 : 0, data.description, data.categoryId, editingId]);
      if (!updated.changes) throw new Error('missingDish');
      await tx.runAsync(`DELETE FROM "${T.image}" WHERE "BIT246755_DishId" = ?`, [editingId]);
    } else {
      const inserted = await tx.runAsync(`INSERT INTO "${T.dish}" (
        "BIT246755_Name", "BIT246755_Price", "BIT246755_PreparationTime", "BIT246755_IsAvailable",
        "BIT246755_Description", "BIT246755_DishCategoryId") VALUES (?, ?, ?, ?, ?, ?)`,
      [data.name, data.price, data.preparationTime, data.isAvailable ? 1 : 0, data.description, data.categoryId]);
      resultId = inserted.lastInsertRowId;
    }
    for (let i = 0; i < data.images.length; i++) {
      await tx.runAsync(`INSERT INTO "${T.image}" (
        "BIT246755_DishId", "BIT246755_ImageUrl", "BIT246755_IsThumbnail") VALUES (?, ?, ?)`,
      [resultId, data.images[i].imageUrl, i === data.thumbnailIndex ? 1 : 0]);
    }
    await markDirty(tx, 'dish', resultId);
  });
  notifyLocalChange();
  return resultId;
}

export async function deleteDish(id) {
  const db = await openDb();
  await db.withExclusiveTransactionAsync(async (tx) => {
    const r = await tx.runAsync(`DELETE FROM "${T.dish}" WHERE "BIT246755_Id" = ?`, [id]);
    if (!r.changes) throw new Error('missingDish');
    await markDirty(tx, 'dish', id, true);
  });
  notifyLocalChange();
}

export async function saveCategory(name, description, editingId = null) {
  const db = await openDb();
  let resultId = editingId;
  await db.withExclusiveTransactionAsync(async (tx) => {
    const already = await tx.getFirstAsync(`SELECT "BIT246755_Id" AS id FROM "${T.category}"
      WHERE lower(trim("BIT246755_Name")) = lower(trim(?))
        AND (? IS NULL OR "BIT246755_Id" != ?)`, [name, editingId, editingId]);
    if (already) throw new Error('categoryDuplicate');
    if (editingId != null) {
      const r = await tx.runAsync(`UPDATE "${T.category}"
        SET "BIT246755_Name"=?, "BIT246755_Description"=?
        WHERE "BIT246755_Id"=?`, [name, description, editingId]);
      if (!r.changes) throw new Error('missingCategory');
    } else {
      const r = await tx.runAsync(`INSERT INTO "${T.category}"
        ("BIT246755_Name", "BIT246755_Description") VALUES (?, ?)`, [name, description]);
      resultId = r.lastInsertRowId;
    }
    await markDirty(tx, 'category', resultId);
  });
  notifyLocalChange();
  return resultId;
}

export async function deleteCategory(id) {
  const db = await openDb();
  await db.withExclusiveTransactionAsync(async (tx) => {
    const c = await tx.getFirstAsync(`SELECT COUNT(*) AS n FROM "${T.dish}"
      WHERE "BIT246755_DishCategoryId"=?`, [id]);
    if (c.n > 0) throw new Error('categoryUsed');
    const r = await tx.runAsync(`DELETE FROM "${T.category}" WHERE "BIT246755_Id"=?`, [id]);
    if (!r.changes) throw new Error('missingCategory');
    await markDirty(tx, 'category', id, true);
  });
  notifyLocalChange();
}
