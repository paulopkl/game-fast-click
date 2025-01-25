FROM node:22.12.0-alpine as build-stage

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Rodar a build de produção do Angular
RUN npm run build --prod

########### Multi Stage BUILD ###########
FROM nginx:alpine as production-stage

COPY --from=build-stage /app/dist/ /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
