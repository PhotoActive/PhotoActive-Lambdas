#!/bin/bash
for d in */ ; do
  f="${d%?}"
  echo $f
  echo $d
  cd $d
  zip -r ../$f.zip *
  cd ..
done
# aws s3 cp . s3://photo-active-lambda --recursive --exclude "*" --include "*.zip"
for d in *.zip ; do
  aws s3 cp $d s3://photo-active-lambda
done
echo
echo "-----"
echo
aws s3 ls s3://photo-active-lambda
