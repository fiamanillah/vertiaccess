#!/usr/bin/expect -f
set timeout -1
spawn node_modules/.bin/prisma migrate dev --name unify_vtid
expect "We need to reset the"
send "y\r"
expect eof
