wiki-evolution
==============
[![Node.js CI](https://github.com/macbre/wiki-evolution/actions/workflows/node.js.yml/badge.svg)](https://github.com/macbre/wiki-evolution/actions/workflows/node.js.yml)

Visualize evolution of your [MediaWiki](https://www.mediawiki.org/wiki/MediaWiki) based site

# wiki-evolution
[![Node.js CI](https://github.com/macbre/wiki-evolution/actions/workflows/node.js.yml/badge.svg)](https://github.com/macbre/wiki-evolution/actions/workflows/node.js.yml)

Visualize evolution of your [MediaWiki](https://www.mediawiki.org/wiki/MediaWiki) based site.

## Docker-based Run

The easiest way to use this tool is via Docker. You can build the Docker image locally from the provided `Dockerfile` and then run it:

### Build the Docker Image
```bash
docker build -t wiki-evolution .
```

### Run the Docker Container
```bash
docker run --name=wiki-evolution --rm -it -v $(pwd)/data:/tmp/wiki-evolution wiki-evolution bash
```

Once inside the container, run:
```bash
./bin/wiki-evolution.sh <wiki domain>
```

Gource log files and the rendered WebM movie will be stored in the `data/` directory on your host.

## Use `npx`

Use the following command execute `wiki-evolution`:

```bash
npx wiki-evolution <wiki domain>
```

Your system will need `gource` installed.

## From the repo

1. Clone the repo

2. **Install Dependencies**:
   Ensure you have `gource` installed on your system. Refer to the Requirements section for installation commands.

3. **Run the Command**:
```bash
./bin/wiki2gource.js <wiki domain>
```

Alternatively, if you want to use `npx` to execute `wiki2gource.js`, you can run:
```bash
npx wiki2gource <wiki domain>
```



Gource log files and the rendered webm movie will be stored in the `data/` directory on your host.

## Requirements

* MediaWiki-based wiki
* [gource](https://github.com/acaudwell/Gource) for visualizing the history (will create a set of images)
* [ffmpeg](https://www.ffmpeg.org/) to convert a set of images to a video file
* [xvfb](http://www.x.org/releases/X11R7.6/doc/man/man1/Xvfb.1.xhtml) to run gource in a virtual X server environment
* [nodejs](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager) with `npm` installed

Running

```
sudo apt-get install gource ffmpeg xvfb
```

should be enough on Debian-powered machines

For MacOS run:

```
brew install gource ffmpeg
```

## How to install and run it?

```
npm install -g wiki-evolution
```

and then run `wiki-evolution <wiki domain>`, for instance:

```
wiki-evolution poznan.wikia.com
wiki-evolution fo.wikipedia.org
```

This will install `wiki-evolution` npm module globally
and render the visualization for [poznan.wikia.com](http://poznan.wikia.com) and [Faroese Wikipedia](http://fo.wikipedia.org).

For large wikis with a long edits history you can include every N-th edit only:

```
EDITS_COMPRESSION=150 wiki-evolution muppet.wikia.com
```

This will include only the first, 150th, 300th, ... edit of each article.

## Debug mode

Run the `wiki-evolution` script with `DEBUG=1` env variable set to enable `nodemw` library debug mode:

```
DEBUG=1 EDITS_COMPRESSION=150 wiki-evolution muppet.wikia.com
...
debug:   API action: query
debug:   GET <http://muppet.wikia.com/api.php?action=query&prop=revisions&rvprop=ids%7Ctimestamp%7Csize%7Cflags%7Ccomment%7Cuser&rvdir=newer&rvlimit=5000&titles=X&continue=&format=json>
...
```

## Genesis

Port of [WikiEvolution extension](https://github.com/Wikia/app/tree/dev/extensions/wikia/hacks/WikiEvolution)
developed during [Wikia 2012 internship programme](http://community.wikia.com/wiki/User_blog:Macbre/Awesome_Projects_from_our_Interns)
by [@drzejzi](https://github.com/Drzejzi). It's meant to be run standalone (i.e. outside MediaWiki stack) and generate
[wonderful videos](https://www.youtube.com/watch?v=QE32HghV8-I) of how your site evolved from its very beginning.

### Examples

<img width="1267" alt="Screenshot 2021-10-28 at 12 25 07" src="https://user-images.githubusercontent.com/1929317/139246771-12842daa-e6bc-48fd-b9ed-d75fa55a6196.png">

* [Poznań Wiki](https://www.youtube.com/watch?v=QE32HghV8-I)
* [Inciclopedia](https://www.youtube.com/watch?v=-AsGVA3HlSU)
* [German GTA Wiki](https://www.youtube.com/watch?v=a3NbIf3i36g)
* [Muppet Wiki](https://www.youtube.com/watch?v=P-ciO2CcIq0)
* [Kill Bill Wiki](https://www.youtube.com/watch?v=Xbhg1NDIQMs)
* [Marvel Database](https://www.youtube.com/watch?v=l6tggAc8aVM)
* [Polish GTA Wiki](https://www.youtube.com/watch?v=T3hlgdBsX10)
* [Nordycka Wiki](https://youtu.be/Z-GAgJMxTR0)

## Read more

* [gource - recording Videos](http://code.google.com/p/gource/wiki/Videos)
