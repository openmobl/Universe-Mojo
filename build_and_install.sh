#!/bin/bash

STAGING="staging/"

if [ -d 

echo "**** Cleaning Universe"

#rm ${STAGING}com.openmobl.app.universe_*

if [ -d ${STAGING} ] then
    mkdir ${STAGING}
else
    rm -rf ${STAGING}
    mkdir ${STAGING}
fi

echo "**** Staging Universe"

cp -R com.openmobl.app.universe/ ${STAGING}

echo "**** Staging Metrix"



palm-package ${STAGING}com.openmobl.app.universe
palm-install ${STAGING}com.openmobl.app.universe_*