#!/bin/bash

echo 'Testing handleMetadata coverage'
./node_modules/grunt/bin/grunt test:core/test/unit/helpers/ghost_head_spec.js > handleMetadataCoverage.txt
g++ -std=c++11 parseHandleMetadataCoverage.cpp -o parseHandleMetadataCoverage
./parseHandleMetadataCoverage <  handleMetadataCoverage.txt
