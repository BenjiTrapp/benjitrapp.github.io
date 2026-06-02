---
layout: memory
title: Splunk Cheatsheet
---

I **really** don't like Splunk documentation. Why is it so hard to find out how to do a certain action? So this is a cheatsheet that I constructed to help me quickly gain knowledge that I need.

## Quick Reference Card

| Command | Description | Example |
|---------|-------------|---------|
| `search` | Filter events by keyword/field matching, supports wildcards | `search status=404 host="web*"` |
| `where` | Filter using expressions and functions (no wildcards) | `where len(user) > 3 AND isnotnull(email)` |
| `stats` | Aggregate statistics (count, avg, sum, dc, etc.) | `stats count, avg(duration) by host` |
| `eval` | Create or modify fields with expressions | `eval gb = bytes/1024/1024/1024` |
| `rex` | Extract fields using regex or sed-mode replacement | `rex field=_raw "user=(?<user>\w+)"` |
| `table` | Display only specified fields in tabular format | `table _time, host, status, uri` |
| `rename` | Rename fields | `rename data.user to user` |
| `fields` | Keep or remove fields from results (improves performance) | `fields + host, status, response_time` |
| `sort` | Sort results by field(s), prefix `-` for descending | `sort -count, +host` |
| `dedup` | Remove duplicate events based on field values | `dedup src_ip, dest_ip` |
| `top` | Show most common values of a field | `top limit=10 useragent` |
| `rare` | Show least common values of a field | `rare limit=10 status` |
| `head` / `tail` | Return first/last N results | `head limit=20` |
| `timechart` | Stats aggregated over time (for visualization) | `timechart span=1h count by status` |
| `chart` | Create a table of stats, split by a field | `chart avg(cpu) over host by app` |
| `bin` | Bucket continuous values (often `_time`) into discrete bins | `bin _time span=5m` |
| `transaction` | Group related events into transactions | `transaction session_id maxspan=30m` |
| `join` | SQL-like join between results and a subsearch | `join type=left user [search index=hr]` |
| `append` | Append results of a subsearch to current results | `append [search index=other_log]` |
| `appendpipe` | Append summary rows computed from current results | `appendpipe [stats sum(count) as count]` |
| `lookup` | Enrich events with data from a lookup table | `lookup geo_ip ip as src_ip OUTPUT country` |
| `inputlookup` | Load a lookup table as search results | `\| inputlookup employees.csv` |
| `outputlookup` | Write results to a lookup table | `\| outputlookup blocked_ips.csv` |
| `tstats` | High-performance stats on indexed fields (tsidx) | `\| tstats count where index=web by host` |
| `eventstats` | Add aggregated stats as new fields without reducing rows | `eventstats avg(rt) as avg_rt by host` |
| `streamstats` | Running/cumulative statistics over streaming results | `streamstats sum(bytes) as running_total` |
| `fillnull` | Replace null field values with a specified value | `fillnull value="N/A" user, email` |
| `mvexpand` | Expand multivalue field into separate events | `mvexpand recipients` |
| `mvindex` | Return specific index from multivalue field | `eval first=mvindex(items, 0)` |
| `mvfilter` | Filter values in a multivalue field | `eval errs=mvfilter(match(msgs,"ERROR"))` |
| `mvjoin` | Join multivalue field into a single string | `eval all_users=mvjoin(users, ", ")` |
| `coalesce` | Return first non-null value from a list of fields | `eval name=coalesce(display_name, user)` |
| `case` | Multi-condition evaluation (like switch) | `eval sev=case(code>=500,"crit",true(),"ok")` |
| `if` | Ternary conditional expression | `eval status=if(rc=0, "ok", "fail")` |
| `strftime` | Format epoch time as human-readable string | `eval t=strftime(_time, "%Y-%m-%d %H:%M")` |
| `strptime` | Parse a date string into epoch time | `eval t=strptime(date, "%d/%b/%Y")` |
| `replace` | Replace string values in a field | `replace "localhost" with "127.0.0.1" in host` |
| `rex mode=sed` | In-place regex substitution on a field | `rex mode=sed field=msg "s/\\s+/ /g"` |
| `addtotals` | Add a field summing across numeric fields per row | `addtotals col=true labelfield=total` |
| `highlight` | Highlight specified terms in raw events | `highlight error, warning, critical` |
| `fieldsummary` | Show summary statistics for all fields | `\| fieldsummary` |
| `makemv` | Split a single-value field into multivalue | `makemv delim="," tags` |
| `mvcombine` | Combine multiple events into multivalue field | `mvcombine delim="," src_ip` |
| `xyseries` | Convert stats results into a table format | `xyseries _time host count` |
| `untable` | Convert tabular results back to stats-style rows | `untable _time, series, value` |
| `collect` | Write results into a summary index | `collect index=summary marker="report=daily"` |
| `map` | Run a search for each result (like a for-each loop) | `map search="search index=X user=$user$"` |
| `multisearch` | Run multiple searches simultaneously | `\| multisearch [search idx=a] [search idx=b]` |
| `foreach` | Run eval for each field matching a pattern | `foreach *_bytes [eval total=total+'<<FIELD>>']` |

- [Analysis](#analysis)
  - [Events over time](#events-over-time)
  - [Percentile and Statistical Analysis](#percentile-and-statistical-analysis)
- [Arrays](#arrays)
  - [Does an array contain a specific value?](#does-an-array-contain-a-specific-value)
  - [Extracting values from an array](#extracting-values-from-an-array)
- [Strings](#strings)
  - [String Matching (with whitespace suppression)](#string-matching-with-whitespace-suppression)
  - [String Replacement](#string-replacement)
  - [String Concatenation](#string-concatenation)
  - [Substrings](#substrings)
- [eval](#eval)
- [Working with Multiple Queries](#working-with-multiple-queries)
  - [Subsearch](#subsearch)
  - [Joins](#joins)
  - [Append and Appendpipe](#append-and-appendpipe)
- [Filtering](#filtering)
  - [NOT v !=](#not-v-)
  - [where vs search](#where-vs-search)
- [Formatting](#formatting)
- [Time Handling](#time-handling)
- [Performance Tips](#performance-tips)
- [Lookup Tables](#lookup-tables)
- [Transactions](#transactions)
- [Regular Expressions](#regular-expressions)
- [Miscellaneous Gotchas](#miscellaneous-gotchas)
  - [Using rename](#using-rename)
  - [Splunk Query Magic](#splunk-query-magic)
    - [AND, OR operator in splunk search](#and-or-operator-in-splunk-search)
    - [Splunk Top command](#splunk-top-command)
    - [Wildcards in splunk search](#wildcards-in-splunk-search)
    - [dedup command](#dedup-command)
    - [head and tail](#head-and-tail)
    - [stats](#stats)
    - [eval](#eval-1)
- [Tips and Tricks](#tips-and-tricks)
- [References](#references)


<!-- cSpell:disable -->
## Analysis

### Events over time

```bash
index="my_log"
| bin span=1hr _time
| stats count by _time
```

OR

```bash
index="my_log"
| timechart count span=1hr
```

### Percentile and Statistical Analysis

```bash
# Get response time percentiles
index="web_logs"
| stats avg(response_time) as avg_rt,
        median(response_time) as median_rt,
        perc95(response_time) as p95_rt,
        perc99(response_time) as p99_rt
        by endpoint

# Standard deviation to find outliers
index="web_logs"
| eventstats avg(response_time) as avg_rt, stdev(response_time) as stdev_rt
| where response_time > (avg_rt + 2*stdev_rt)
```

## Arrays

### Does an array contain a specific value?

```bash
"array_name{}"=value

# Nested arrays
"dictionary_name.array_name{}.dictionary2.deep_nested_array{}"=value
```

### Extracting values from an array

```bash
eval variable_name=mvindex('array_name{}', array_index)

# Get the length of a multivalue field
eval array_length=mvcount('array_name{}')

# Filter multivalue fields
eval filtered=mvfilter(match('array_name{}', "pattern"))
```

## Strings

### String Matching (with whitespace suppression)

If you're unable to match field values as you expect, extract the non-whitespace values from the field and compare against that instead.

For example, in the below example, `context.messageStatus` may contain whitespace, so Splunk won't capture them with a standard `=`. Instead, we need to do the following:

```bash
index="my_log"
| rex field=context.MessageStatus "(?<messageStatus>\w+)"
| eval status=if(messageStatus = "undelivered", "fail", "success")
| search status="success"
```

If you're trying to get multiple matches, use `max_match`, where `max_match=0` finds unlimited matches.

### String Replacement

```bash
rex mode=sed field=your_field "regex_statement"

# This is especially handy when you want to ignore whitespace!
# Example:
#    rex mode=sed field=my_field "s/ //g"
```

### String Concatenation

```bash
eval variable_name = "string1" . "string2"

# This is just like PHP
# Example:
#     eval word = "foo" . "bar" | table word
#
# Output:
#    word
#    ----
#    foobar 
```

### Substrings

```bash
eval variable_name = substr(variable, start_index, length)

# Example:
#    eval word = "foobar" | eval short = substr(word, 1, 3) | table short
#
# Output:
#    short
#    -----
#    oob
```

## eval

Trying to use a nested value in a dictionary, in an eval statement? Use **rename** first!

```bash
Example Entry:
{
    "signals": {
        "ip_address": "1.2.3.4",
    },
}

Query:
    | rename signals.ip_address as ip_addr
    | eval ip_addr=if(isnull(ip_addr), "null", ip_addr)
```

### Useful eval patterns

```bash
# Case statement (much cleaner than nested if)
| eval severity=case(
    status>=500, "critical",
    status>=400, "warning",
    status>=200, "ok",
    true(), "unknown"
  )

# Coalesce - return first non-null value
| eval user=coalesce(username, email, "anonymous")

# Convert epoch to human readable
| eval human_time=strftime(_time, "%Y-%m-%d %H:%M:%S")

# Parse a date string to epoch
| eval epoch_time=strptime(date_field, "%d/%b/%Y:%H:%M:%S")

# Ternary-style conditional
| eval label=if(count>100, "high", "low")
```

## Working with Multiple Queries

### Subsearch

This is used for funneling the output of one splunk query, into another query. However, some older splunk versions do not support it. See [this link](https://answers.splunk.com/answers/129424/how-to-compare-fields-over-multiple-sourcetypes-without-join-append-or-use-of-subsearches.html) for inspiration.

```bash
Example Logs:

nginx_logs
----------
{
 "useragent": "Chrome",
 "status":    200,
 "user":      "random-hash",
}

api_logs
--------
{
 "endpoint":   "/userinfo",
 "request-id": "random-hash",
}

Objective: Find out the useragent

Query:
    index=*
        (endpoint="/userinfo" AND request-id="random-hash") OR user="random-hash"
        | stats count by useragent
 
Explanation:
This searches all logs and tries to cross-reference a request-id from `api_logs`, and
searches for its useragent from `nginx_logs`. Note that the search parameters for the
log in `api_logs` should be as unique as possible, so that it won't pull information
from other logs.
```

### Joins

Joins are handy, when they work. This is a semi-complicated example I've used:

```bash
Example Logs:

suspicious_ips
--------------
{
    "ip_address": "1.2.3.4",
}

valid_ips
-----------
{
    "ip_address": "1.2.3.4",
}

Objective: Determine which IPs in `suspicious_ips` have NOT been logged in `valid_ips`.

Query:
    sourcetype=suspicious_ips
        | join type=left ip_address [
            search search_name=valid_ips
            | stats count by ip_address, search_name
          ]
        | search NOT search_name=valid_ips
```

When doing this, **remember to put `search` in the subsearch**! Otherwise, it won't work at all.

### Append and Appendpipe

```bash
# Append: Combine results from two completely different searches
index="web_logs" status=500
| stats count as error_count by host
| append [
    search index="web_logs" status=200
    | stats count as success_count by host
  ]

# Appendpipe: Add summary rows to existing results
index="web_logs"
| stats count by status
| appendpipe [stats sum(count) as count | eval status="TOTAL"]
```

## Filtering

### NOT v !=

This is so lame, and is such a gotcha. [Original source](http://docs.splunk.com/Documentation/Splunk/7.0.2/Search/NOTexpressions).

Turns out, empty string is considered "not existing". Which means, if you have a column of either empty string, or value, and you want to get empty strings only, **use NOT** rather than !=.

### where vs search

```bash
# 'where' treats unquoted strings as field names, supports functions
| where isnotnull(user) AND len(user) > 3

# 'search' treats unquoted strings as literals, supports wildcards
| search user=admin* status!=404

# Key difference: 'where' evaluates EXPRESSIONS, 'search' does MATCHING
# 'where' does NOT support wildcards; 'search' does NOT support functions
```

## Formatting

I like things looking nice. Often this also means better usability, as it takes less mental energy to parse output
meant for machines. However, Splunk is a **terrible** means to nicely format output, especially when trying to send
this output downstream (like JIRA).

Through lots of trial and error, I have found these patterns to work nicely:

- Use `rex` to extract values

- Use `eval` to assign temporary variables

- Use `mvexpand` to split multiple results from `rex` into their own separate rows

- Use `stats list(<field_to_combine>) as <new_name_for_field> by <params_you_want_to_group_together>`
  to combine rows.
  
- Use `nomv` to teach JIRA to recognize multi-value rows, then use `rex` to replace spaces with new lines.
  IMPORTANT: Even though Splunk does not show the new lines, it will come out as expected in JIRA!

## Time Handling

```bash
# Relative time modifiers (use in time picker or with earliest/latest)
earliest=-24h latest=now        # Last 24 hours
earliest=-7d@d latest=@d        # Last 7 days, snapped to day boundary
earliest=-1h@h                  # Last hour, snapped to hour

# Convert between time formats
| eval formatted=strftime(_time, "%Y-%m-%d %H:%M:%S %Z")
| eval epoch=strptime("2024-01-15 10:30:00", "%Y-%m-%d %H:%M:%S")

# Calculate time differences
| eval duration=end_time - start_time
| eval duration_minutes=round(duration/60, 2)

# Group by time buckets
| bin _time span=5m
| stats count by _time
```

## Performance Tips

Splunk searches can be painfully slow. Here are ways to speed them up:

1. **Be as specific as possible early** - Filter with index, sourcetype, host FIRST
2. **Avoid wildcards at the beginning** of strings (`*error` is slow, `error*` is fast)
3. **Use `fields` command** to limit fields passed through the pipeline
4. **Use `stats` instead of `transaction`** when possible (much faster)
5. **Limit time range** - shorter time ranges = faster searches
6. **Use `tstats`** for indexed fields (dramatically faster than regular search)

```bash
# SLOW: Searches all data then filters
index=* | search sourcetype="access_log" status=500

# FAST: Filters at search time
index="web" sourcetype="access_log" status=500

# Even FASTER for indexed fields: use tstats
| tstats count where index="web" sourcetype="access_log" by host, status

# Use fields to reduce data in pipeline
index="web" sourcetype="access_log"
| fields host, status, response_time
| stats avg(response_time) by host
```

## Lookup Tables

```bash
# Use a CSV lookup to enrich data
index="firewall"
| lookup threat_intel_lookup ip_address as src_ip OUTPUT threat_level, threat_category

# Define an automatic lookup (in transforms.conf) or use inputlookup
| inputlookup my_lookup_table.csv
| search category="critical"

# Write results to a lookup table
index="web_logs" status=500
| stats count by src_ip
| where count > 100
| outputlookup suspicious_ips.csv
```

## Transactions

```bash
# Group related events into transactions (e.g., a user session)
index="web_logs"
| transaction session_id maxspan=30m maxpause=5m
| where duration > 60
| table session_id, duration, eventcount

# Note: 'transaction' is resource-intensive. Prefer 'stats' when you only need aggregation:
index="web_logs"
| stats min(_time) as start, max(_time) as end, count as eventcount by session_id
| eval duration = end - start
| where duration > 60
```

## Regular Expressions

```bash
# Extract with named capture groups
| rex field=_raw "user=(?<username>\w+)"

# Multiple extractions from same field
| rex field=url "\/api\/(?<api_version>v\d+)\/(?<endpoint>\w+)"

# rex with max_match for multiple matches per event
| rex field=_raw max_match=0 "error_code=(?<error_codes>\d+)"

# Common regex patterns for Splunk:
#   IP address: (?<ip>\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})
#   Email:      (?<email>[\w.+-]+@[\w-]+\.[\w.]+)
#   UUID:       (?<uuid>[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})
#   URL path:   (?<path>\/[\w\/.-]+)
```

## Miscellaneous Gotchas

### Using rename

For some wacky reason,

```bash
stats count by data.user as user
```

is not the same as

```bash
stats count by data.user | rename data.user to user
```

The **latter** works as expected. I guess learning this method is always better, since it also works
when trying to count by multiple items.

```bash
stats count by data.user, data.email | rename data.user to user
```

### Splunk Query Magic

```bash
index=<Your-Index-Name>_* cf_app_name=*<Appname>* <anysearch key>
        
index="<index>_*"  cf_app_name="<APP-NAME>*"  sourcetype="cf:logmessage" cf_space_name="*" source_type="APP/PROC/WEB"   "msg.logLevel"=INFO "*<keyword for search>*"
```

#### AND, OR operator in splunk search

```bash
"error" AND "database"
"error" OR "database"
```

#### Splunk Top command

```bash
error | top limit=1 error
```

#### Wildcards in splunk search

```bash
keyword 2*
# Shows all logs which contain 2, 200, 21, 207, etc.
```
                       
#### dedup command

Dedup command removes duplicate values from the result.

```bash
* | dedup uid

# Keep the first N duplicates
* | dedup 3 uid

# Sort before dedup to control which duplicate is kept
* | sort -_time | dedup uid
```

#### head and tail 

If searched for all errors and pipe it to head it will display first 10 most recent logs for errors and vice versa for tail.

```bash
error | head
error | head limit=10
error | tail limit=5
```

#### stats 

Gives you statistics, i.e. number of occurrences of the event/field.

```bash
error | stats count by error

# Multiple aggregations
index="web_logs"
| stats count, avg(response_time) as avg_rt, max(response_time) as max_rt by endpoint

# Distinct count
index="web_logs"
| stats dc(src_ip) as unique_visitors by endpoint
```

#### eval 

Eval modifies or creates new fields. Eval is normally used to evaluate an arbitrary expression, perform mathematical operations, rename fields, etc.

```bash
# Mathematical operations
| eval gb_used = bytes_used / 1024 / 1024 / 1024

# String functions
| eval domain = lower(split(email, "@", 2))
| eval masked = replace(credit_card, "(\d{4})\d{8}(\d{4})", "\1********\2")
```

-----------------------------------------------------------------------

## Tips and Tricks

### Debugging Searches

```bash
# See what fields are available
index="my_log" | fieldsummary

# Check field values distribution
index="my_log" | top limit=20 status

# See raw events with specific fields highlighted
index="my_log" | highlight error, warning, critical
```

### Alerting Patterns

```bash
# Alert when error rate exceeds threshold
index="web_logs"
| bin _time span=5m
| stats count(eval(status>=500)) as errors, count as total by _time
| eval error_rate = round(errors/total*100, 2)
| where error_rate > 5
```

### Useful SPL Idioms

```bash
# Fillnull - replace null values
| fillnull value="N/A" username, email

# Multivalue to single value (for display)
| eval users = mvjoin(mvdedup(user_list), ", ")

# Create a calculated field and use it immediately
| eval severity=case(count>1000,"critical", count>100,"warning", true(),"info")
| stats count by severity

# Conditional stats
| stats count(eval(status="success")) as successes,
        count(eval(status="failure")) as failures
```

### Macros (for reusable searches)

Define in Settings > Advanced Search > Search Macros, then use:

```bash
# Usage of a macro named "get_errors" with argument
`get_errors(index_name)`

# A macro can expand to any valid SPL fragment
# Example macro definition "get_errors(1)":
#   index="$index_name$" (status>=500 OR level=ERROR)
```

-----------------------------------------------------------------------

## References

- [Splunk Search Reference (PDF)](https://docs.splunk.com/Documentation/Splunk/latest/SearchReference)
- [Splunk Quick Reference Guide (PDF)](https://www.splunk.com/pdfs/solution-guides/splunk-quick-reference-guide.pdf)
- [SPL2 Search Manual](https://docs.splunk.com/Documentation/SplunkCloud/latest/SearchReference/AboutSPL2)
- [Splunk Regular Expressions](https://docs.splunk.com/Documentation/Splunk/latest/Knowledge/AboutSplunkregularexpressions)
- [Common Eval Functions](https://docs.splunk.com/Documentation/Splunk/latest/SearchReference/CommonEvalFunctions)
- [Stats and Charting Functions](https://docs.splunk.com/Documentation/Splunk/latest/SearchReference/CommonStatsFunctions)
- [Search Command Reference by Category](https://docs.splunk.com/Documentation/Splunk/latest/SearchReference/Commandsbycategory)
- [Splunk Lantern (Use Case Library)](https://lantern.splunk.com/)
- [Splunk Regex Cheatsheet](https://mindmajix.com/splunk-regex-cheatsheet)
- [LZone Splunk Cheat Sheet](https://lzone.de/cheat-sheet/Splunk)
- [Splunk Community / Answers](https://community.splunk.com/)
- [GoSplunk - Search Examples](https://gosplunk.com/)

<!-- cSpell:enable -->
