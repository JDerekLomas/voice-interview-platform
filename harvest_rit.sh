#!/usr/bin/env bash
set -euo pipefail

#############################################################################
# Settings you might change later
#############################################################################
TENANT="rit"              # Maior tenant
USERNAME="BPH1"           # your login
COLLECTION_NAME="Scans"   # the Maior collection we want
MAX_PARALLEL=4            # simultaneous image downloads

#############################################################################
# Ask once for the password (hidden input)
#############################################################################
read -s -p "Maior password for ${USERNAME}: " PASSWORD
echo

#############################################################################
# Find the dataset UUID whose name matches \$COLLECTION_NAME
#############################################################################
DATASET_KEY=$(curl -s -u "${USERNAME}:${PASSWORD}" \
  "https://maior.memorix.nl/api/tenant/${TENANT}/datasets" \
  | jq -r --arg NAME "$COLLECTION_NAME" '.[] | select(.name==$NAME) | .uuid')

if [[ -z "$DATASET_KEY" ]]; then
  echo "‼  Could not find dataset called '${COLLECTION_NAME}' — aborting." >&2
  exit 1
fi
echo "→ Using dataset UUID: $DATASET_KEY"

#############################################################################
# Directory layout
#############################################################################
mkdir -p xml images logs

#############################################################################
# Step A -- Harvest ALL metadata via OAI-PMH
#############################################################################
BASE="https://maior.memorix.nl/api/oai/${TENANT}/key/${DATASET_KEY}"
TOKEN=""
PAGE=0
while : ; do
  if [[ -z "$TOKEN" ]]; then
    URL="${BASE}?verb=ListRecords&metadataPrefix=oai_dc"
  else
    URL="${BASE}?verb=ListRecords&resumptionToken=${TOKEN}"
  fi
  printf "→ Fetching metadata page %s…\n" "$PAGE"
  curl -s "$URL" -o "xml/page_${PAGE}.xml"
  TOKEN=$(xmlstarlet sel -t -v "//*[local-name()='resumptionToken']" "xml/page_${PAGE}.xml")
  [[ -z "$TOKEN" ]] && break
  PAGE=$((PAGE+1))
done
echo "✓ Metadata harvest finished — $(ls xml | wc -l) pages saved."

#############################################################################
# Step B -- Extract every IIIF image-UUID from the XML
#############################################################################
grep -hoE "https://images\\.memorix\\.nl/${TENANT}/iiif/[0-9a-f-]+" xml/*.xml \
  | sed "s@.*/iiif/@@g" | sort -u > uuids.txt
echo "✓ Found $(wc -l < uuids.txt) unique image UUIDs." | tee logs/count.txt

#############################################################################
# Step C -- Download one full-res JPEG per UUID
#############################################################################
parallel -j "$MAX_PARALLEL" --bar \
  'curl -s -o images/{1}.jpg \
  "https://images.memorix.nl/'"${TENANT}"'/iiif/{1}/full/full/0/default.jpg"' \
  :::: uuids.txt

echo "🎉  All done — metadata in ./xml, JPEGs in ./images"
