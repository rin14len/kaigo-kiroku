#!/bin/sh
sleep 5
npx prisma db push
npx prisma generate
node index.js