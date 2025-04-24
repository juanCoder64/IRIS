# Pasos para ejecutar el demo:
```
cd Viewers-3.10.1
```
### Se usa orthanc para esta demo, es posible integrar con otros servicios como AWS
```
# Runs orthanc so long as window remains open
yarn run orthanc:up
```
### Ejecutar el proyecto y conectar con servidor local de orthanc
```
# If you haven't already, enable yarn workspaces
yarn config set workspaces-experimental true

# Restore dependencies
yarn install

# Run our dev command, but with the local orthanc config
yarn run dev:orthanc
```
