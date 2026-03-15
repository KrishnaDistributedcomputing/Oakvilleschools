"""Crawl4AI Oakville Schools Enrichment - seeds DB + crawls web sources."""
import re, sys, asyncio, traceback
import psycopg2

DB_URL = "postgresql://oakvilleadmin:OakV1ll3Sch00ls!2026@data-psql-oakvilleschools-prod.postgres.database.azure.com:5432/oakville_schools?sslmode=require"

def make_slug(name):
    s = re.sub(r"[^a-z0-9\s-]", "", name.lower().strip())
    return re.sub(r"-+", "-", re.sub(r"\s+", "-", s)).strip("-")

def insert_school(cur, conn, name, stype, sub, op, addr, phone, web, grades, age_range=None, licensed=None):
    slug = make_slug(name)
    m = re.search(r"[A-Z]\d[A-Z]\s?\d[A-Z]\d", addr or "")
    postal = m.group(0).upper() if m else None
    cur.execute("SELECT id FROM schools WHERE slug = %s", (slug,))
    if cur.fetchone():
        return "skip"
    cur.execute(
        """INSERT INTO schools (name,slug,school_type,subtype,operator,address_line_1,
           city,province,postal_code,phone,website,grades,age_range,licensed)
           VALUES (%s,%s,%s,%s,%s,%s,'Oakville','Ontario',%s,%s,%s,%s,%s,%s)""",
        (name, slug, stype, sub, op, addr, postal, phone, web, grades, age_range, licensed))
    conn.commit()
    return "new"

def seed_schools():
    print("Connecting to DB...")
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    cur.execute("SELECT count(*) FROM schools")
    before = cur.fetchone()[0]
    print(f"Before: {before} schools")
    created = 0
    skipped = 0
    schools = [
        ("E.J. James Public School","public","elementary","Halton District School Board","390 Lakeshore Rd W, Oakville, ON L6K 1G3","(905) 845-7695","https://ejj.hdsb.ca","JK-8"),
        ("Ethel Gardiner Public School","public","elementary","Halton District School Board","2111 Carding Mill Trail, Oakville, ON L6M 0A7","(905) 827-2077","https://etg.hdsb.ca","JK-8"),
        ("Forest Trail Public School","public","elementary","Halton District School Board","1430 Wisteria Lane, Oakville, ON L6M 3Z1","(905) 847-1172","https://for.hdsb.ca","JK-8"),
        ("Gladys Speers Public School","public","elementary","Halton District School Board","56 Dunn St, Oakville, ON L6J 3C5","(905) 845-3069","https://gla.hdsb.ca","JK-8"),
        ("Heritage Glen Public School","public","elementary","Halton District School Board","2305 Sixth Line, Oakville, ON L6H 6W3","(905) 257-1440","https://her.hdsb.ca","JK-8"),
        ("Irma Coulson Public School","public","elementary","Halton District School Board","2601 Brickstone Mews, Oakville, ON L6H 0K5","(905) 257-1565","https://irc.hdsb.ca","JK-8"),
        ("James W. Hill Public School","public","elementary","Halton District School Board","350 Chartwell Rd, Oakville, ON L6J 4A1","(905) 845-7782","https://jwh.hdsb.ca","JK-8"),
        ("John T. Tuck Public School","public","elementary","Halton District School Board","3220 Woodhurst Crescent, Oakville, ON L6L 6E2","(905) 827-3500","https://jtt.hdsb.ca","JK-5"),
        ("John William Boich Public School","public","elementary","Halton District School Board","1610 Heritage Way, Oakville, ON L6M 0B6","(905) 847-9570","https://jwb.hdsb.ca","JK-8"),
        ("Kings Road Public School","public","elementary","Halton District School Board","285 Church St, Oakville, ON L6J 7B7","(905) 845-4381","https://kin.hdsb.ca","JK-8"),
        ("Maple Grove Public School","public","elementary","Halton District School Board","305 Maple Grove Dr, Oakville, ON L6J 4V4","(905) 845-1491","https://map.hdsb.ca","JK-8"),
        ("Munns Public School","public","elementary","Halton District School Board","1070 McCraney St E, Oakville, ON L6H 3G6","(905) 845-4362","https://mun.hdsb.ca","JK-8"),
        ("New Central Public School","public","elementary","Halton District School Board","350 Randall St, Oakville, ON L6J 1P9","(905) 845-3652","https://new.hdsb.ca","JK-8"),
        ("Oakwood Public School","public","elementary","Halton District School Board","1010 Morrison Rd, Oakville, ON L6J 4J3","(905) 845-4373","https://oak.hdsb.ca","JK-8"),
        ("Orchard Park Public School","public","elementary","Halton District School Board","1065 Fourth Line, Oakville, ON L6H 1P6","(905) 844-1316","https://opp.hdsb.ca","JK-8"),
        ("Paul A. Fisher Public School","public","elementary","Halton District School Board","2466 Postmaster Dr, Oakville, ON L6M 0G2","(905) 257-9933","https://paf.hdsb.ca","JK-8"),
        ("Pineland Public School","public","elementary","Halton District School Board","308 Pine Glen Rd, Oakville, ON L6K 3M3","(905) 845-5014","https://pil.hdsb.ca","JK-8"),
        ("Robert Baldwin Public School","public","elementary","Halton District School Board","340 Randall St, Oakville, ON L6J 1P7","(905) 845-3101","https://rob.hdsb.ca","JK-8"),
        ("W. H. Morden Public School","public","elementary","Halton District School Board","31 Merritt Rd, Oakville, ON L6L 3P5","(905) 827-1181","https://whm.hdsb.ca","JK-8"),
        ("Brookdale Public School","public","elementary","Halton District School Board","277 Brookdale Ave, Oakville, ON L6J 3Y5","(905) 845-6021","https://bro.hdsb.ca","JK-8"),
        ("Brantwood Public School","public","elementary","Halton District School Board","219 Brant St, Oakville, ON L6K 2J1","(905) 845-5052","https://bra.hdsb.ca","JK-8"),
        ("Cedar Ridge Public School","public","elementary","Halton District School Board","2375 Cedar Ridge Dr, Oakville, ON L6J 5C7","(905) 845-8181","https://ced.hdsb.ca","JK-8"),
        ("Chris Hadfield Public School","public","elementary","Halton District School Board","1551 Heritage Way, Oakville, ON L6M 4H1","(905) 847-4880","https://chf.hdsb.ca","JK-8"),
        ("Oodenawi Public School","public","elementary","Halton District School Board","2525 Postmaster Dr, Oakville, ON L6M 0K1","(905) 257-0655","https://ood.hdsb.ca","JK-8"),
        ("Emily Carr Public School","public","elementary","Halton District School Board","302 Millbank Dr, Oakville, ON L6H 3S3","(905) 844-0321","https://emi.hdsb.ca","JK-8"),
        ("Abbey Lane Public School","public","elementary","Halton District School Board","1344 Glen Abbey Gate, Oakville, ON L6M 2Z2","(905) 827-4040","https://abl.hdsb.ca","JK-5"),
        ("Dr. Charles Best Public School","public","elementary","Halton District School Board","101 Pine Glen Rd, Oakville, ON L6K 3M6","(905) 845-7891","https://dcb.hdsb.ca","JK-8"),
        ("C. H. Norton Public School","public","elementary","Halton District School Board","1300 Rebecca St, Oakville, ON L6L 1Y7","(905) 827-3050","https://chn.hdsb.ca","JK-8"),
        ("St. Matthew Catholic Elementary School","catholic","elementary","Halton Catholic District School Board","1140 McCraney St E, Oakville, ON L6H 3H8","(905) 845-7741","https://smt.hcdsb.org","JK-8"),
        ("St. Michael Catholic Elementary School","catholic","elementary","Halton Catholic District School Board","341 Morden Rd, Oakville, ON L6K 3A4","(905) 845-3893","https://smi.hcdsb.org","JK-8"),
        ("St. Joan of Arc Catholic Elementary School","catholic","elementary","Halton Catholic District School Board","2155 Calloway Dr, Oakville, ON L6M 0B3","(905) 847-0890","https://sjo.hcdsb.org","JK-8"),
        ("St. Gregory the Great Catholic Elementary School","catholic","elementary","Halton Catholic District School Board","88 Bronte Rd, Oakville, ON L6L 3C3","(905) 827-3370","https://sgr.hcdsb.org","JK-8"),
        ("St. Vincent Catholic Elementary School","catholic","elementary","Halton Catholic District School Board","2278 Country Club Dr, Oakville, ON L6M 0B6","(905) 257-0906","https://svi.hcdsb.org","JK-8"),
        ("Guardian Angels Catholic Elementary School","catholic","elementary","Halton Catholic District School Board","2121 Sawgrass Dr, Oakville, ON L6H 6Z3","(905) 257-2833","https://gua.hcdsb.org","JK-8"),
        ("Mother Teresa Catholic Elementary School","catholic","elementary","Halton Catholic District School Board","2480 Sixth Line, Oakville, ON L6H 6W4","(905) 257-0134","https://mot.hcdsb.org","JK-8"),
        ("Our Lady of Peace Catholic Elementary School","catholic","elementary","Halton Catholic District School Board","2485 Sixth Line, Oakville, ON L6H 6X2","(905) 849-4811","https://olp.hcdsb.org","JK-8"),
        ("St. Joseph Catholic Elementary School","catholic","elementary","Halton Catholic District School Board","341 Sumner Ave, Oakville, ON L6K 2C5","(905) 845-6510","https://sjc.hcdsb.org","JK-8"),
        ("St. Mildreds-Lightbourn School","private","elementary","St. Mildreds-Lightbourn School","1080 Linbrook Rd, Oakville, ON L6J 2L1","(905) 845-2386","https://www.smls.on.ca","JK-12"),
        ("Al-Falah Islamic School","private","elementary","Al-Falah Islamic School","391 Burnhamthorpe Rd E, Oakville, ON L6H 7B1","(905) 257-1519","https://www.alfalahislamicschool.com","JK-8"),
        ("Oakville Christian School","private","elementary","Oakville Christian School","112 Third Line, Oakville, ON L6L 3Z7","(905) 825-8144","https://www.oakvillechristianschool.org","JK-8"),
        ("Rotherglen School Oakville","private","elementary","Rotherglen School","465 Morden Rd, Oakville, ON L6K 3W5","(905) 337-6800","https://www.rotherglen.com","PS-8"),
        ("Walden International School","private","elementary","Walden International School","2520 Sixth Line, Oakville, ON L6H 6W4","(905) 257-3327","https://www.waldeninternationalschool.com","JK-8"),
        ("Wildwood Academy","private","elementary","Wildwood Academy","2268 Sixth Line, Oakville, ON L6H 6W3","(905) 257-4756","https://www.wildwoodacademy.ca","JK-8"),
        ("Casa Montessori Oakville","montessori","elementary","Casa Montessori","323 Kerr St, Oakville, ON L6K 3B6","(905) 845-6631","https://www.casamontessorioakville.ca","PS-6"),
        ("Bronte Montessori School","montessori","elementary","Bronte Montessori","2413 Rebecca St, Oakville, ON L6L 2B2","(905) 827-0348","https://www.brontemontessori.com","PS-6"),
        ("Glen Abbey Montessori School","montessori","elementary","Glen Abbey Montessori","1515 Rebecca St, Oakville, ON L6L 2A7","(905) 338-8881",None,"PS-6"),
    ]
    for s in schools:
        r = insert_school(cur, conn, *s)
        if r == "new":
            created += 1
            print(f"  + {s[0]}")
        else:
            skipped += 1
    daycares = [
        ("Wee Watch Oakville","daycare","daycare","Wee Watch","Oakville, Ontario","(905) 338-2288",None,None,"0-12",True),
        ("Peekaboo Child Care Oakville","daycare","daycare","Peekaboo Child Care","2011 Winston Park Dr, Oakville, ON L6H 6P5","(905) 829-3222","https://www.peekaboochildcare.ca",None,"Infant-12",True),
        ("Kids and Company Oakville","daycare","daycare","Kids and Company","2010 Winston Park Dr, Oakville, ON L6H 5R7","(905) 829-3533","https://www.kidsandcompany.com",None,"Infant-5",True),
        ("Tiny Hoppers Oakville","daycare","daycare","Tiny Hoppers","1250 Cornwall Rd, Oakville, ON L6J 7T5","(905) 337-5959","https://www.tinyhoppers.ca",None,"6w-4y",True),
        ("Lullaboo Nursery Oakville","daycare","daycare","Lullaboo Nursery","2501 Third Line, Oakville, ON L6M 5A8","(905) 582-7800","https://www.lullaboo.ca",None,"Infant-4",True),
        ("YMCA Oakville Child Care","daycare","daycare","YMCA of Oakville","410 Rebecca St, Oakville, ON L6K 1K7","(905) 845-3417","https://www.ymcahalton.org",None,"Infant-12",True),
        ("Nannies on Call Oakville","daycare","daycare","Nannies on Call","Oakville, Ontario","(905) 337-9595",None,None,"Infant-12",True),
        ("Country Day Montessori Oakville","daycare","daycare","Country Day Montessori","3265 Wynnefield Gate, Oakville, ON L6L 0A8","(905) 469-2322","https://www.countrydaymontessori.ca",None,"18m-6y",True),
    ]
    for d in daycares:
        r = insert_school(cur, conn, *d)
        if r == "new":
            created += 1
            print(f"  + {d[0]}")
        else:
            skipped += 1
    cur.execute("SELECT count(*) FROM schools")
    after = cur.fetchone()[0]
    cur.execute("SELECT school_type, count(*) FROM schools GROUP BY school_type ORDER BY count(*) DESC")
    breakdown = cur.fetchall()
    conn.close()
    print(f"\nSeed complete: {before} -> {after} schools (+{created} new, {skipped} existed)")
    for r in breakdown:
        print(f"  {r[0]:15s} {r[1]:4d}")
    return after

async def crawl_web_sources():
    print(f"\n{'='*50}")
    print("Crawl4AI Web Scraping Phase")
    print(f"{'='*50}")
    from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    created = 0
    browser_config = BrowserConfig(headless=True, verbose=False)
    async with AsyncWebCrawler(config=browser_config) as crawler:
        config = CrawlerRunConfig(cache_mode=CacheMode.BYPASS)
        # Crawl OurKids
        print("\n--- ourkids.net ---")
        try:
            result = await crawler.arun(url="https://www.ourkids.net/ontario/oakville-schools.php", config=config)
            if result.success and result.markdown:
                names = re.findall(r"([A-Z][A-Za-z\s'.&-]+(?:School|Academy|College|Montessori|Institute|Centre))", result.markdown)
                for name in set(n.strip() for n in names):
                    if 5 < len(name) < 80:
                        stype = "montessori" if "montessori" in name.lower() else "private"
                        if insert_school(cur, conn, name, stype, "elementary", name, "Oakville, Ontario", None, None, None) == "new":
                            created += 1
                            print(f"    + {name}")
        except Exception as e:
            print(f"  OurKids error: {e}")
        await asyncio.sleep(3)
        # Crawl HDSB
        print("\n--- hdsb.ca ---")
        try:
            result = await crawler.arun(url="https://www.hdsb.ca/schools/school-directory/", config=config)
            if result.success and result.html:
                links = re.findall(r'href="(https://([a-z]+)\.hdsb\.ca)"[^>]*>([^<]+)</a>', result.html, re.I)
                for href, sub, name in links:
                    name = name.strip()
                    if name and "hdsb.ca" not in name.lower() and len(name) > 3:
                        if insert_school(cur, conn, name, "public", "elementary", "Halton District School Board", "Oakville, Ontario", None, href, "JK-8") == "new":
                            created += 1
                            print(f"    + {name}")
        except Exception as e:
            print(f"  HDSB error: {e}")
    cur.execute("SELECT count(*) FROM schools")
    total = cur.fetchone()[0]
    conn.close()
    print(f"\nCrawl4AI added {created} new. Total: {total}")

if __name__ == "__main__":
    try:
        seed_schools()
        asyncio.run(crawl_web_sources())
    except Exception as e:
        print(f"\nERROR: {e}")
        traceback.print_exc()
        sys.exit(1)
