# remove any enabled default site configs from nginx sites-enabled (these are just symlinks to sites-available)
sudo rm /etc/nginx/sites-enabled/default
# copy virtual host config files to /etc/nginx/sites-available
sudo cp ./nginx_vpatlas_dev.conf /etc/nginx/sites-available/dev.vpatlas
sudo cp ./nginx_vpatlas.conf /etc/nginx/sites-available/vpatlas
# enable vpatlas nginx site
host = $(hostname)
if ["$host" = "dev.vpatlas.org"]; then
    sudo ln -s /etc/nginx/sites-available/dev.vpatlas /etc/nginx/sites-enabled/dev.vpatlas
fi
if ["$host" = "vpatlas.org"]; then
    sudo ln -s /etc/nginx/sites-available/vpatlas /etc/nginx/sites-enabled/vpatlas
fi