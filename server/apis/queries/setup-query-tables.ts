import { api, z, databricks } from "@superblocksteam/sdk-api";

const DATABRICKS_ID = "fec4c713-ef05-4e2c-82f2-5c33f8ac15b7";

export default api({
  name: "SetupQueryTables",
  description: "Creates and seeds analytics tables in Databricks for Source Query Editor",

  integrations: {
    databricks_vumc: databricks(DATABRICKS_ID),
  },

  input: z.object({}),
  output: z.object({ message: z.string() }),

  async run(ctx) {
    const db = ctx.integrations.databricks_vumc;
    const CountSchema = z.object({ cnt: z.coerce.number() });
    const results: string[] = [];

    // Helper: create table + seed if empty
    async function setupTable(name: string, ddl: string, seedSql: string) {
      await db.execute(ddl, [], { label: `Create ${name}` });
      const rows = await db.query(
        `SELECT COUNT(*) as cnt FROM workspace.default.${name}`,
        CountSchema, [], { label: `Count ${name}` }
      );
      if (rows[0].cnt > 0) {
        results.push(`${name}: already has ${rows[0].cnt} rows`);
        return;
      }
      await db.execute(seedSql, [], { label: `Seed ${name}` });
      const after = await db.query(
        `SELECT COUNT(*) as cnt FROM workspace.default.${name}`,
        CountSchema, [], { label: `Verify ${name}` }
      );
      results.push(`${name}: seeded ${after[0].cnt} rows`);
    }

    // ── 1. pharmacy_locations ──
    await setupTable("pharmacy_locations",
      `CREATE TABLE IF NOT EXISTS workspace.default.pharmacy_locations (
        location_id STRING, name STRING, region STRING, pharmacy_type STRING,
        operating_status STRING, staffing_level_pct INT, capacity_utilization_pct INT
      )`,
      `INSERT INTO workspace.default.pharmacy_locations VALUES
        ('loc-01','Meridian Health Main Campus','Northeast','Hospital','Active',72,91),
        ('loc-02','Riverside Medical Center','Southeast','Hospital','Active',88,74),
        ('loc-03','Northgate Specialty Pharmacy','Northeast','Specialty','Active',65,88),
        ('loc-04','Westfield Central Fill Center','Midwest','Central Fill','Limited',58,95),
        ('loc-05','Lakewood Ambulatory Pharmacy','Midwest','Clinic','Active',93,62),
        ('loc-06','Summit Transplant Services','West','Specialty','Active',96,71),
        ('loc-07','Piedmont Regional Mail Order','Southeast','Mail Order','Active',81,83),
        ('loc-08','Oakwood Community Pharmacy','Central','Retail','Active',100,55)`
    );

    // ── 2. operational_daily_metrics (7 days × 8 locations) ──
    await setupTable("operational_daily_metrics",
      `CREATE TABLE IF NOT EXISTS workspace.default.operational_daily_metrics (
        metric_date DATE, location_id STRING, prescription_volume INT,
        avg_turnaround_min DOUBLE, open_exception_count INT, service_level_pct DOUBLE,
        delayed_prescriptions INT, resolved_exceptions INT
      )`,
      `INSERT INTO workspace.default.operational_daily_metrics VALUES
        (DATE_SUB(CURRENT_DATE(),6),'loc-01',412,28.5,8,94.2,14,3),
        (DATE_SUB(CURRENT_DATE(),6),'loc-02',287,22.1,3,97.1,6,2),
        (DATE_SUB(CURRENT_DATE(),6),'loc-03',156,35.8,12,88.5,9,4),
        (DATE_SUB(CURRENT_DATE(),6),'loc-04',623,18.3,5,96.8,8,5),
        (DATE_SUB(CURRENT_DATE(),6),'loc-05',198,24.7,2,98.2,3,1),
        (DATE_SUB(CURRENT_DATE(),6),'loc-06',134,42.1,6,91.0,7,2),
        (DATE_SUB(CURRENT_DATE(),6),'loc-07',445,19.6,4,97.5,5,3),
        (DATE_SUB(CURRENT_DATE(),6),'loc-08',178,21.2,1,99.1,2,1),
        (DATE_SUB(CURRENT_DATE(),5),'loc-01',398,29.1,9,93.8,16,2),
        (DATE_SUB(CURRENT_DATE(),5),'loc-02',301,21.5,4,96.9,7,3),
        (DATE_SUB(CURRENT_DATE(),5),'loc-03',148,37.2,11,87.9,10,3),
        (DATE_SUB(CURRENT_DATE(),5),'loc-04',641,17.9,4,97.1,7,4),
        (DATE_SUB(CURRENT_DATE(),5),'loc-05',205,23.8,2,98.5,2,2),
        (DATE_SUB(CURRENT_DATE(),5),'loc-06',129,43.5,7,90.2,8,1),
        (DATE_SUB(CURRENT_DATE(),5),'loc-07',461,19.1,3,97.8,4,4),
        (DATE_SUB(CURRENT_DATE(),5),'loc-08',182,20.8,1,99.3,1,1),
        (DATE_SUB(CURRENT_DATE(),4),'loc-01',425,27.3,7,94.8,12,4),
        (DATE_SUB(CURRENT_DATE(),4),'loc-02',295,22.8,5,96.5,8,2),
        (DATE_SUB(CURRENT_DATE(),4),'loc-03',162,34.1,10,89.2,8,5),
        (DATE_SUB(CURRENT_DATE(),4),'loc-04',618,18.7,6,96.4,9,3),
        (DATE_SUB(CURRENT_DATE(),4),'loc-05',192,25.3,3,97.9,4,1),
        (DATE_SUB(CURRENT_DATE(),4),'loc-06',141,40.6,5,91.8,6,3),
        (DATE_SUB(CURRENT_DATE(),4),'loc-07',438,20.2,5,97.1,6,2),
        (DATE_SUB(CURRENT_DATE(),4),'loc-08',175,21.9,2,98.8,3,1),
        (DATE_SUB(CURRENT_DATE(),3),'loc-01',441,26.8,6,95.1,11,5),
        (DATE_SUB(CURRENT_DATE(),3),'loc-02',312,21.2,3,97.4,5,4),
        (DATE_SUB(CURRENT_DATE(),3),'loc-03',170,33.5,9,89.8,7,4),
        (DATE_SUB(CURRENT_DATE(),3),'loc-04',655,17.5,3,97.5,6,6),
        (DATE_SUB(CURRENT_DATE(),3),'loc-05',211,23.1,1,98.8,2,2),
        (DATE_SUB(CURRENT_DATE(),3),'loc-06',137,41.2,6,90.9,7,2),
        (DATE_SUB(CURRENT_DATE(),3),'loc-07',472,18.8,2,98.1,3,3),
        (DATE_SUB(CURRENT_DATE(),3),'loc-08',189,20.4,1,99.4,1,1),
        (DATE_SUB(CURRENT_DATE(),2),'loc-01',418,28.0,8,94.5,13,3),
        (DATE_SUB(CURRENT_DATE(),2),'loc-02',289,22.4,4,96.8,7,2),
        (DATE_SUB(CURRENT_DATE(),2),'loc-03',155,36.1,11,88.8,9,3),
        (DATE_SUB(CURRENT_DATE(),2),'loc-04',632,18.1,5,96.9,8,4),
        (DATE_SUB(CURRENT_DATE(),2),'loc-05',200,24.2,2,98.4,3,2),
        (DATE_SUB(CURRENT_DATE(),2),'loc-06',132,42.8,7,90.5,8,1),
        (DATE_SUB(CURRENT_DATE(),2),'loc-07',451,19.4,4,97.6,5,3),
        (DATE_SUB(CURRENT_DATE(),2),'loc-08',180,21.0,1,99.2,2,1),
        (DATE_SUB(CURRENT_DATE(),1),'loc-01',435,27.1,7,95.0,12,4),
        (DATE_SUB(CURRENT_DATE(),1),'loc-02',305,21.8,3,97.2,6,3),
        (DATE_SUB(CURRENT_DATE(),1),'loc-03',165,34.5,10,89.5,8,4),
        (DATE_SUB(CURRENT_DATE(),1),'loc-04',648,17.7,4,97.3,7,5),
        (DATE_SUB(CURRENT_DATE(),1),'loc-05',208,23.5,2,98.6,2,2),
        (DATE_SUB(CURRENT_DATE(),1),'loc-06',139,41.0,5,91.3,6,3),
        (DATE_SUB(CURRENT_DATE(),1),'loc-07',466,19.0,3,97.9,4,3),
        (DATE_SUB(CURRENT_DATE(),1),'loc-08',185,20.6,1,99.3,1,1),
        (CURRENT_DATE(),'loc-01',408,28.8,9,93.9,15,2),
        (CURRENT_DATE(),'loc-02',282,22.6,5,96.4,8,1),
        (CURRENT_DATE(),'loc-03',151,36.5,12,88.2,10,3),
        (CURRENT_DATE(),'loc-04',615,18.5,6,96.6,9,3),
        (CURRENT_DATE(),'loc-05',195,24.9,3,98.0,4,1),
        (CURRENT_DATE(),'loc-06',128,43.2,7,90.1,8,2),
        (CURRENT_DATE(),'loc-07',440,19.8,5,97.3,6,2),
        (CURRENT_DATE(),'loc-08',172,21.5,2,98.9,3,1)`
    );

    // ── 3. operational_exceptions ──
    await setupTable("operational_exceptions",
      `CREATE TABLE IF NOT EXISTS workspace.default.operational_exceptions (
        exception_id STRING, location_id STRING, issue_category STRING,
        priority STRING, status STRING, assigned_owner STRING,
        created_at TIMESTAMP, days_open INT, prescriptions_affected INT
      )`,
      `INSERT INTO workspace.default.operational_exceptions VALUES
        ('EXC-4001','loc-01','Insurance','Critical','In Progress','Marcus Webb',CURRENT_TIMESTAMP() - INTERVAL 5 DAYS,5,12),
        ('EXC-4002','loc-03','Inventory','High','New','Sarah Kim',CURRENT_TIMESTAMP() - INTERVAL 3 DAYS,3,8),
        ('EXC-4003','loc-01','Technology','Medium','Under Review','James Chen',CURRENT_TIMESTAMP() - INTERVAL 7 DAYS,7,45),
        ('EXC-4004','loc-04','Workflow Delay','High','Assigned','Lisa Park',CURRENT_TIMESTAMP() - INTERVAL 2 DAYS,2,23),
        ('EXC-4005','loc-06','Insurance','Critical','Waiting on External Party','Marcus Webb',CURRENT_TIMESTAMP() - INTERVAL 10 DAYS,10,6),
        ('EXC-4006','loc-02','Staffing','Medium','In Progress','Rachel Torres',CURRENT_TIMESTAMP() - INTERVAL 4 DAYS,4,0),
        ('EXC-4007','loc-07','Vendor','High','New','David Okafor',CURRENT_TIMESTAMP() - INTERVAL 1 DAYS,1,15),
        ('EXC-4008','loc-05','Prescription Clarification','Low','Assigned','Sarah Kim',CURRENT_TIMESTAMP() - INTERVAL 6 DAYS,6,2),
        ('EXC-4009','loc-03','Insurance','High','In Progress','James Chen',CURRENT_TIMESTAMP() - INTERVAL 8 DAYS,8,9),
        ('EXC-4010','loc-08','Technology','Low','Resolved','Lisa Park',CURRENT_TIMESTAMP() - INTERVAL 12 DAYS,12,0),
        ('EXC-4011','loc-01','Inventory','Critical','New','Marcus Webb',CURRENT_TIMESTAMP() - INTERVAL 1 DAYS,1,31),
        ('EXC-4012','loc-04','Shipping','Medium','In Progress','Rachel Torres',CURRENT_TIMESTAMP() - INTERVAL 3 DAYS,3,18),
        ('EXC-4013','loc-06','Insurance','High','Under Review','David Okafor',CURRENT_TIMESTAMP() - INTERVAL 5 DAYS,5,7),
        ('EXC-4014','loc-02','Workflow Delay','Medium','Resolved','Sarah Kim',CURRENT_TIMESTAMP() - INTERVAL 15 DAYS,15,11),
        ('EXC-4015','loc-07','Capacity','High','Assigned','James Chen',CURRENT_TIMESTAMP() - INTERVAL 2 DAYS,2,0)`
    );

    // ── 4. hourly_metrics (today × 8 locations × 12 hours) ──
    await setupTable("hourly_metrics",
      `CREATE TABLE IF NOT EXISTS workspace.default.hourly_metrics (
        metric_hour INT, metric_date DATE, location_id STRING, prescription_volume INT
      )`,
      `INSERT INTO workspace.default.hourly_metrics VALUES
        (7,CURRENT_DATE(),'loc-01',18),(8,CURRENT_DATE(),'loc-01',35),(9,CURRENT_DATE(),'loc-01',52),(10,CURRENT_DATE(),'loc-01',48),(11,CURRENT_DATE(),'loc-01',41),(12,CURRENT_DATE(),'loc-01',38),
        (13,CURRENT_DATE(),'loc-01',44),(14,CURRENT_DATE(),'loc-01',50),(15,CURRENT_DATE(),'loc-01',46),(16,CURRENT_DATE(),'loc-01',39),(17,CURRENT_DATE(),'loc-01',28),(18,CURRENT_DATE(),'loc-01',19),
        (7,CURRENT_DATE(),'loc-02',12),(8,CURRENT_DATE(),'loc-02',24),(9,CURRENT_DATE(),'loc-02',38),(10,CURRENT_DATE(),'loc-02',35),(11,CURRENT_DATE(),'loc-02',30),(12,CURRENT_DATE(),'loc-02',27),
        (13,CURRENT_DATE(),'loc-02',31),(14,CURRENT_DATE(),'loc-02',34),(15,CURRENT_DATE(),'loc-02',29),(16,CURRENT_DATE(),'loc-02',22),(17,CURRENT_DATE(),'loc-02',15),(18,CURRENT_DATE(),'loc-02',10),
        (7,CURRENT_DATE(),'loc-03',8),(8,CURRENT_DATE(),'loc-03',14),(9,CURRENT_DATE(),'loc-03',22),(10,CURRENT_DATE(),'loc-03',20),(11,CURRENT_DATE(),'loc-03',17),(12,CURRENT_DATE(),'loc-03',15),
        (13,CURRENT_DATE(),'loc-03',19),(14,CURRENT_DATE(),'loc-03',21),(15,CURRENT_DATE(),'loc-03',16),(16,CURRENT_DATE(),'loc-03',12),(17,CURRENT_DATE(),'loc-03',9),(18,CURRENT_DATE(),'loc-03',5),
        (7,CURRENT_DATE(),'loc-04',28),(8,CURRENT_DATE(),'loc-04',55),(9,CURRENT_DATE(),'loc-04',82),(10,CURRENT_DATE(),'loc-04',75),(11,CURRENT_DATE(),'loc-04',65),(12,CURRENT_DATE(),'loc-04',58),
        (13,CURRENT_DATE(),'loc-04',68),(14,CURRENT_DATE(),'loc-04',72),(15,CURRENT_DATE(),'loc-04',61),(16,CURRENT_DATE(),'loc-04',48),(17,CURRENT_DATE(),'loc-04',35),(18,CURRENT_DATE(),'loc-04',22),
        (7,CURRENT_DATE(),'loc-05',9),(8,CURRENT_DATE(),'loc-05',17),(9,CURRENT_DATE(),'loc-05',26),(10,CURRENT_DATE(),'loc-05',24),(11,CURRENT_DATE(),'loc-05',21),(12,CURRENT_DATE(),'loc-05',19),
        (13,CURRENT_DATE(),'loc-05',22),(14,CURRENT_DATE(),'loc-05',25),(15,CURRENT_DATE(),'loc-05',20),(16,CURRENT_DATE(),'loc-05',16),(17,CURRENT_DATE(),'loc-05',11),(18,CURRENT_DATE(),'loc-05',7),
        (7,CURRENT_DATE(),'loc-06',6),(8,CURRENT_DATE(),'loc-06',11),(9,CURRENT_DATE(),'loc-06',18),(10,CURRENT_DATE(),'loc-06',16),(11,CURRENT_DATE(),'loc-06',14),(12,CURRENT_DATE(),'loc-06',12),
        (13,CURRENT_DATE(),'loc-06',15),(14,CURRENT_DATE(),'loc-06',17),(15,CURRENT_DATE(),'loc-06',13),(16,CURRENT_DATE(),'loc-06',10),(17,CURRENT_DATE(),'loc-06',7),(18,CURRENT_DATE(),'loc-06',4),
        (7,CURRENT_DATE(),'loc-07',20),(8,CURRENT_DATE(),'loc-07',38),(9,CURRENT_DATE(),'loc-07',58),(10,CURRENT_DATE(),'loc-07',54),(11,CURRENT_DATE(),'loc-07',46),(12,CURRENT_DATE(),'loc-07',42),
        (13,CURRENT_DATE(),'loc-07',48),(14,CURRENT_DATE(),'loc-07',52),(15,CURRENT_DATE(),'loc-07',44),(16,CURRENT_DATE(),'loc-07',36),(17,CURRENT_DATE(),'loc-07',24),(18,CURRENT_DATE(),'loc-07',16),
        (7,CURRENT_DATE(),'loc-08',8),(8,CURRENT_DATE(),'loc-08',15),(9,CURRENT_DATE(),'loc-08',23),(10,CURRENT_DATE(),'loc-08',21),(11,CURRENT_DATE(),'loc-08',18),(12,CURRENT_DATE(),'loc-08',16),
        (13,CURRENT_DATE(),'loc-08',19),(14,CURRENT_DATE(),'loc-08',22),(15,CURRENT_DATE(),'loc-08',17),(16,CURRENT_DATE(),'loc-08',14),(17,CURRENT_DATE(),'loc-08',10),(18,CURRENT_DATE(),'loc-08',6)`
    );

    // ── 5. shipping_records ──
    await setupTable("shipping_records",
      `CREATE TABLE IF NOT EXISTS workspace.default.shipping_records (
        shipment_id STRING, location_id STRING, carrier STRING,
        tracking_number STRING, status STRING, shipped_date DATE,
        estimated_delivery DATE, temperature_controlled BOOLEAN
      )`,
      `INSERT INTO workspace.default.shipping_records VALUES
        ('SHP-3001','loc-01','FedEx','FX-7829104','In Transit',DATE_SUB(CURRENT_DATE(),2),DATE_ADD(CURRENT_DATE(),1),true),
        ('SHP-3002','loc-03','UPS','1Z-8841923','In Transit',DATE_SUB(CURRENT_DATE(),1),DATE_ADD(CURRENT_DATE(),2),true),
        ('SHP-3003','loc-04','McKesson Direct','MK-5512847','Delivered',DATE_SUB(CURRENT_DATE(),5),DATE_SUB(CURRENT_DATE(),2),false),
        ('SHP-3004','loc-06','FedEx','FX-9931028','Pending',CURRENT_DATE(),DATE_ADD(CURRENT_DATE(),3),true),
        ('SHP-3005','loc-02','Cardinal Health','CH-4420159','In Transit',DATE_SUB(CURRENT_DATE(),1),CURRENT_DATE(),false),
        ('SHP-3006','loc-07','UPS','1Z-7718302','Out for Delivery',DATE_SUB(CURRENT_DATE(),3),CURRENT_DATE(),false),
        ('SHP-3007','loc-05','FedEx','FX-6643291','Pending',CURRENT_DATE(),DATE_ADD(CURRENT_DATE(),2),true),
        ('SHP-3008','loc-01','AmerisourceBergen','AB-3319847','In Transit',DATE_SUB(CURRENT_DATE(),2),DATE_ADD(CURRENT_DATE(),1),false),
        ('SHP-3009','loc-08','McKesson Direct','MK-8827401','Delivered',DATE_SUB(CURRENT_DATE(),4),DATE_SUB(CURRENT_DATE(),1),false),
        ('SHP-3010','loc-03','FedEx','FX-1154829','In Transit',DATE_SUB(CURRENT_DATE(),1),DATE_ADD(CURRENT_DATE(),1),true)`
    );

    return { message: results.join(" | ") };
  },
});
