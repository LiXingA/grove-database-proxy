FROM node:18-alpine

LABEL maintainer="Xing <xing@kineviz.com>,Sean <sean@kineviz.com>"

#app directory
RUN mkdir -p /opt/app/upload

WORKDIR /opt/app

# Install linux command tools
RUN apk update -vU --allow-untrusted 

RUN apk add --no-cache \
            sed \
            bash \
            shadow \   
    && rm -rf /var/cache/* \
    && mkdir /var/cache/apk

# Install app dependencies
## dependencies
COPY ./package.json /share/
### replace the devDependencies to ignoreDependencies
RUN sed -i 's/devDependencies/ignoreDependencies/ig' /share/package.json
RUN cd /share && yarn install --ignore-optional

COPY ./ /opt/app

VOLUME /data

# Install  localhost-ssl-proxy
EXPOSE 2901

#For Release 
ENV NODE_ENV=production

ENTRYPOINT ["/opt/app/Dockerfile.init.sh"]