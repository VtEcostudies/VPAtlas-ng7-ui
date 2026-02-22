git checkout new_vtecostudies_site

# If you already applied the COG patch:
git apply -R vpatlas-cog-layer.patch
npm install   # to clean out georaster packages

# Then apply the correct one:
git apply vpatlas-leafoff-layer.patch