---
title: "Copy table schema to new a table"
slug: "copy-table-schema-to-new-a-table"
tags: ["schema", "select-into", "sql", "sql-server", "table"]
date: 2014-06-04T00:00:00
image: "/post/2014-copy-table-schema-to-new-a-table/copytable.jpg"
id: 27
---
In SQL Server, `SELECT INTO` is used to copy data from an existing table/s into a new one.

However by adding a `WHERE` clause which will always return false, this will prevent any data from being copied, and therefore create an empty copy of the table schema into a new table.

For example if we have a table, "TableA", the schema of this table can be copied into a new table, "TableB", by executing the following:

```sql
SELECT *
INTO TableB
FROM TableA
WHERE 1=0
```