

#Simple Game Server

An Express/Node.js/MongoDB application that exposes a RESTfull service to play _Memory_ game online.

Run the application and go to `<http://host>/memory` to see RESTfull documentation.

##Dependencies

You nees to run

    $ npm install
    $ bower install

from the project root directory to get all dependencies.

##Config

Go to `app.js` and change what ever you need before dunning. The only thing that needs configuration is the database connection string

##Run
Make sure that your MongoDB is running. You can do this...
    
    $ mongod --dbpath data/

...or what ever way you use to run MongoDB.

Then start the application by running

    $ npm start

or

    $ node bin/www

