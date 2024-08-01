FROM nginx:stable-alpine

# Copy build application
WORKDIR /usr/share/nginx/html/
COPY index.html .
COPY generated assets/icons/

# Copy config file
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]