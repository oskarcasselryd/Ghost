#!/bin/bash
./node_modules/grunt/bin/grunt test:core/test/integration/model/model_posts_spec.js > postmodeltest.txt
cat postmodeltest.txt | grep -E "(\[*\s+(true|false),*\s*\]*)" | tr -d '\n' | sed -r "s/,\s//g" | sed -r "s/\]\[ /\n/g" | sed -r "s/(\s\]|\[\s)+//g" > out
python script.py
