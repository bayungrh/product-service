#!/bin/bash

serviceName="$1"
imageService="$2"
namespace="$3"

[ ! -d kube-yaml ] && mkdir kube-yaml

cp -f kube-template/* kube-yaml/
(
    cd kube-yaml
    sed -i "s|SERVICE_NAME|${serviceName}|g" *.yaml
    sed -i "s|IMAGE_SERVICE|${imageService}|g" *.yaml
    sed -i "s|NAMESPACE|${namespace}|g" *.yaml
)