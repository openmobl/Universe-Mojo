#!/bin/bash

rm com.openmobl.app.universe_*
palm-package --use-v1-format com.openmobl.app.universe
palm-install com.openmobl.app.universe_*