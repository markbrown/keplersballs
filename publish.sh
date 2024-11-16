#! /bin/sh

SOURCE=production
TARGET=gh-pages

git checkout ${SOURCE}

if git show-ref --quiet refs/heads/${TARGET}; then
    git branch -D ${TARGET}
fi

git checkout -b ${TARGET}
git branch -u origin/${TARGET}
npm run build

for f in dist/*; do
    g=`basename -- $f`
    cp $f $g
    git add $g
done

git commit -m build
echo "Run the following command to publish:"
echo ""
echo "    git push -f"
echo ""
