git checkout new_vtecostudies_site

# Apply the patch
git apply vpatlas-cog-layer.patch

# Install the new packages
npm install

# Commit
git commit -am "Add 2021-22 leaf-off COG base layer"