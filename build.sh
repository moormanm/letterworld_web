#!/bin/bash


npm run dist

babel server.js > server.dist.js
