#!/bin/bash
PERSISTENT_STORAGE_PATH="/data"
echo "Current Storage path ${PERSISTENT_STORAGE_PATH}"
mkdir -p ${PERSISTENT_STORAGE_PATH}/tmp
if [ $? = 0  ];then
    echo "${PERSISTENT_STORAGE_PATH} is writable";
else
  echo "
  Please check the ${PERSISTENT_STORAGE_PATH} permission \n
  e.g.  Mount the \$HOME/database-proxy/data to docker container /data volume \n
    ....  -v  \$HOME/database-proxy/data:/data  .... \n
  Please use \"sudo  chmod 777 -R \$HOME/database-proxy/data \",\n
  then restart the docker container.
  "; 
  exit 1
fi

echo "Check upload volume"

EXTENSION_PATH=$(df -h | grep /opt/app/upload | awk {'print $6'})
if [[ -z "${EXTENSION_PATH}" ]]; then
  echo "
  No found the extension volume /opt/app/upload, will try link to ${PERSISTENT_STORAGE_PATH}/upload
  "
  mkdir -p ${PERSISTENT_STORAGE_PATH}/upload
  rm -rf /opt/app/upload
  ln -sf  ${PERSISTENT_STORAGE_PATH}/upload  /opt/app
else
  echo "
  Found the extension volume /opt/app/upload
  "
fi

#1. handle node_modules
rm -f /opt/app/node_modules 
ln -sf /share/node_modules /opt/app 

#2. Handle config.json
mv -n ${PERSISTENT_STORAGE_PATH}/config.default.json ${PERSISTENT_STORAGE_PATH}/config.json 
rm -f  /opt/app/config.json 
ln -sf ${PERSISTENT_STORAGE_PATH}/config.json /opt/app 

#3.  Start the node app process
echo "Start Databasee Proxy APP "
cd /opt/app \
&& \
node bin/grove-database-proxy start