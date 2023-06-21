# remove any enabled vpatlas site configs from nginx sites-enabled (these are just symlinks to sites-available)
sudo rm /etc/nginx/sites-enabled/vpatlas
sudo rm /etc/nginx/sites-enabled/dev.vpatlas
# enable dev.vpatlas host
sudo ln -s /etc/nginx/sites-available/dev.vpatlas /etc/nginx/sites-enabled/dev.vpatlas
sudo systemctl restart nginx
