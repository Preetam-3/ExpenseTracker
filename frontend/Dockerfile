# Use a lightweight web server
FROM nginx:alpine

# Remove default Nginx static files
RUN rm -rf /usr/share/nginx/html/*

#Copy your website files into the server root
COPY . /usr/share/nginx/html

#Expose port 80 to access in browser
EXPOSE 80

