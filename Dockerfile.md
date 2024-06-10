
### build resource

```
yarn build
```

### build docker image

```
export YARN_REGISTRY=https://registry.npmmirror.com && \
docker build \
--build-arg http_proxy=${http_proxy} \
--build-arg https_proxy=${https_proxy} \
--build-arg NO_PROXY="registry.npmmirror.com" \
-f ./Dockerfile \
-t "kineviz/data-proxy:latest" \
.
```

### run docker container

```
docker rm -f database-proxy \
&& \
docker run -d -it --name database-proxy --restart always \
-v /mnt/f/wsl-docker-containers/data/database-proxy:/data:rw \
-p 2900:2901 \
-e "http_proxy=${http_proxy}" \
-e "https_proxy=${https_proxy}" \
kineviz/data-proxy:latest
```

### run docker with nginx-proxy & letsencrypt-nginx-proxy-companion

```
docker rm -f database-proxy \
&& \
docker run -d -it --name database-proxy --restart always \
-v ~/database-proxy:/data:rw \
-e VIRTUAL_HOST=data.domesticlight.art \
-e VIRTUAL_PORT=2901 \
-e "HTTPS_METHOD=noredirect" \
-e "HSTS=max-age=0; includeSubDomains" \
-e "LETSENCRYPT_HOST=data.domesticlight.art" \
-e "LETSENCRYPT_EMAIL=sean@kineviz.com" \
kineviz/data-proxy:latest

```

### push to docker hub

```
docker push kineviz/data-proxy:latest
```