import * as SQLite from 'expo-sqlite';

let databasePromise;

function openDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(
      'BIT246755_FoodManager.db'
    );
  }
  return databasePromise;
}

export async function initDatabase() {
  const db = await openDatabase();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS "BIT246755_DishCategory" (
      "BIT246755_Id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "BIT246755_Name" TEXT NOT NULL
        CHECK(length(trim("BIT246755_Name")) > 0),
      "BIT246755_Description" TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS "BIT246755_Dish" (
      "BIT246755_Id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "BIT246755_Name" TEXT NOT NULL
        CHECK(length(trim("BIT246755_Name")) > 0),
      "BIT246755_Price" REAL NOT NULL
        CHECK("BIT246755_Price" > 0),
      "BIT246755_PreparationTime" INTEGER NOT NULL
        CHECK("BIT246755_PreparationTime" > 0),
      "BIT246755_IsAvailable" INTEGER NOT NULL DEFAULT 1
        CHECK("BIT246755_IsAvailable" IN (0, 1)),
      "BIT246755_Description" TEXT NOT NULL DEFAULT '',
      "BIT246755_DishCategoryId" INTEGER NOT NULL,
      FOREIGN KEY ("BIT246755_DishCategoryId")
        REFERENCES "BIT246755_DishCategory"("BIT246755_Id")
        ON DELETE RESTRICT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS
      "BIT246755_UniqueDishName"
    ON "BIT246755_Dish" (
      "BIT246755_DishCategoryId",
      lower(trim("BIT246755_Name"))
    );

    CREATE TABLE IF NOT EXISTS "BIT246755_DishImage" (
      "BIT246755_Id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "BIT246755_DishId" INTEGER NOT NULL,
      "BIT246755_ImageUrl" TEXT NOT NULL
        CHECK(length(trim("BIT246755_ImageUrl")) > 0),
      "BIT246755_IsThumbnail" INTEGER NOT NULL DEFAULT 0
        CHECK("BIT246755_IsThumbnail" IN (0, 1)),
      FOREIGN KEY ("BIT246755_DishId")
        REFERENCES "BIT246755_Dish"("BIT246755_Id")
        ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS
      "BIT246755_OneThumbnail"
    ON "BIT246755_DishImage" ("BIT246755_DishId")
    WHERE "BIT246755_IsThumbnail" = 1;
  `);

  await db.withExclusiveTransactionAsync(async (tx) => {
    const result = await tx.getFirstAsync(
      'SELECT COUNT(*) AS total FROM "BIT246755_DishCategory"'
    );

    if (result.total > 0) return;

    const categories = [
      ['Main Course', 'Main dishes'],
      ['Drinks', 'Beverages'],
      ['Desserts', 'Sweet dishes'],
    ];

    const categoryIds = [];

    for (const [name, description] of categories) {
      const inserted = await tx.runAsync(
        `INSERT INTO "BIT246755_DishCategory"
         ("BIT246755_Name", "BIT246755_Description")
         VALUES (?, ?)`,
        [name, description]
      );
      categoryIds.push(inserted.lastInsertRowId);
    }

    const dishes = [
      ['Chicken Rice', 65000, 20, 1, 'Rice with chicken', 0],
      ['Beef Noodles', 75000, 25, 1, 'Beef noodle soup', 0],
      ['Orange Juice', 30000, 5, 1, 'Fresh orange juice', 1],
      ['Iced Tea', 15000, 5, 0, 'Refreshing iced tea', 1],
      ['Chocolate Cake', 45000, 10, 1, 'Chocolate dessert', 2],
    ];

    for (const dish of dishes) {
      await tx.runAsync(
        `INSERT INTO "BIT246755_Dish"
         (
           "BIT246755_Name",
           "BIT246755_Price",
           "BIT246755_PreparationTime",
           "BIT246755_IsAvailable",
           "BIT246755_Description",
           "BIT246755_DishCategoryId"
         )
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          dish[0],
          dish[1],
          dish[2],
          dish[3],
          dish[4],
          categoryIds[dish[5]],
        ]
      );
    }
  });

  return db;
}

export async function getDishes() {
  const db = await openDatabase();

  return db.getAllAsync(`
    SELECT
      d."BIT246755_Id" AS id,
      d."BIT246755_Name" AS name,
      d."BIT246755_Price" AS price,
      d."BIT246755_PreparationTime" AS preparationTime,
      d."BIT246755_IsAvailable" AS isAvailable,
      c."BIT246755_Name" AS categoryName
    FROM "BIT246755_Dish" d
    JOIN "BIT246755_DishCategory" c
      ON d."BIT246755_DishCategoryId" = c."BIT246755_Id"
    ORDER BY d."BIT246755_Id";
  `);
}

// Doc chi tiet mot mon va danh sach anh cua mon do tu SQLite.
export async function getDishDetail(id) {
  const db = await openDatabase();
  const dish = await db.getFirstAsync(
    `SELECT
       d."BIT246755_Id" AS id,
       d."BIT246755_Name" AS name,
       d."BIT246755_Price" AS price,
       d."BIT246755_PreparationTime" AS preparationTime,
       d."BIT246755_IsAvailable" AS isAvailable,
       d."BIT246755_Description" AS description,
       d."BIT246755_DishCategoryId" AS categoryId,
       c."BIT246755_Name" AS categoryName
     FROM "BIT246755_Dish" d
     JOIN "BIT246755_DishCategory" c
       ON d."BIT246755_DishCategoryId" = c."BIT246755_Id"
     WHERE d."BIT246755_Id" = ?`,
    [id]
  );

  if (!dish) return null;

  const images = await db.getAllAsync(
    `SELECT
       "BIT246755_Id" AS id,
       "BIT246755_ImageUrl" AS imageUrl,
       "BIT246755_IsThumbnail" AS isThumbnail
     FROM "BIT246755_DishImage"
     WHERE "BIT246755_DishId" = ?
     ORDER BY "BIT246755_IsThumbnail" DESC, "BIT246755_Id"`,
    [id]
  );

  return { ...dish, images };
}
