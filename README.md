# rili-livingdocs

### Deployment to Docker

First run:
```sh
docker build -t daraff/rili-livingdocs .
docker push daraff/rili-livingdocs
```

### Deployment to your Kube cluster
```sh
# don't forget to set GH_TOKEN in rili.service.yaml
kubectl apply -f rili-service.yaml
```
