## Build with docker


```bash
docker build \
-f ./Dockerfile \
-t "kineviz/data-proxy:latest" \
.
```

### Use Proxy

```bash
export YARN_REGISTRY=https://registry.npm.taobao.org && \
docker build \
--build-arg http_proxy=${http_proxy} \
--build-arg https_proxy=${https_proxy} \
--build-arg NO_PROXY="registry.npm.taobao.org" \
-f ./Dockerfile \
-t "kineviz/data-proxy:latest" \
.
```