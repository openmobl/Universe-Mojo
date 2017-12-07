#!/bin/bash

STAGING="staging/"
METRIX="MetrixLibrary/"

if [ ! -d ${METRIX} ]; then
    echo "Please download the Metrix libraries and extract into ./MetrixLibrary"
    exit
fi;

echo "**** Cleaning Universe"

rm com.openmobl.app.universe_*

if [ ! -d ${STAGING} ]; then
    mkdir ${STAGING}
else
    rm -rf ${STAGING}
    mkdir ${STAGING}
fi;

echo "**** Staging Universe"

cp -R com.openmobl.app.universe/* ${STAGING}

echo "**** Staging Metrix"

cp -R ${METRIX}images ${STAGING}
cp ${METRIX}app/models/metrix.js ${STAGING}app/models/
cp ${METRIX}app/models/metrixCore.js ${STAGING}app/models/
cp ${METRIX}app/models/asyncWrappers.js ${STAGING}app/models/
cp -R ${METRIX}app/views/metrix ${STAGING}app/views/

echo "**** Generating Build Information"

./gen_build.sh ${STAGING}

echo "**** Packaging Universe"

palm-package ${STAGING}

echo "**** Installing Universe"

palm-install com.openmobl.app.universe_*
