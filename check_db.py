import psycopg2
conn = psycopg2.connect('postgresql://oakvilleadmin:OakV1ll3Sch00ls!2026@data-psql-oakvilleschools-prod.postgres.database.azure.com:5432/oakville_schools?sslmode=require')
cur = conn.cursor()
cur.execute('SELECT count(*) FROM schools')
print(f'Total: {cur.fetchone()[0]}')
cur.execute("SELECT school_type, count(*) FROM schools GROUP BY school_type ORDER BY count(*) DESC")
for r in cur.fetchall():
    print(f'  {r[0]:15s} {r[1]}')
conn.close()
