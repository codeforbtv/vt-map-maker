# VT Map Maker
Check out the [Github Page for the project](http://codeforbtv.org/vt-map-maker/).

This tool takes google spreadsheets and returns a statewide map.

Possible inputs include towns, counties, or point data (addresses or coordinates).

## Plan

###Map View
- Map
- attribute table
- browse other maps
- link to create your own map
- consumable on phone
- sharability baked in

###Landing Page

- standard map view plus relevant introductory stuff
- maybe greater emphasis on browsing existing maps?

###Create a Map
- enter spreadsheet URL
- process data
    - sync to server
    - determine if town, county, or point data
        - load and parse data in browser? on server?
    - pick value to map
    - pick attributes to include in table (maybe v2)
- edit map styling
- publish at URL
- login needed

##Phase 2 Ideas
- optionally add census data to attribute table
- fork a map

##Lead Developers
[Joe Di Stefano](http://twitter.com/joeydi)

[Matt Parrilla](http://twitter.com/mattparrilla)

##Want to help?
Check out the project [issues](https://github.com/codeforbtv/vt-map-maker/issues) for a rough to-do list and get in touch!

## Set Up

1. Install [virtualenv](https://pypi.python.org/pypi/virtualenv)

2. Clone the repository

        $ git clone git@github.com:codeforbtv/vt-map-maker.git

3. Create Virtual Environment in project

        $ cd vt-map-maker
        $ virtualenv venv

4. Enter virtual environment

        $ source venv/bin/activate

5. Install requirements

        $ pip install -r requirements.txt

7. Install grunt modules ([read this](http://24ways.org/2013/grunt-is-not-weird-and-hard/) if getting started with Grunt)

        $ cd app/static
        $ npm install

8. Install javascript libraries (from `app/static`)

        $ bower install

##Develop

To get grunt running in the background:

        $ cd app/static
        $ grunt

To run local server, get back to project root in a new terminal tab and run:

        $ python app/index.py

The project will be viewable at http://127.0.0.1:5000/
