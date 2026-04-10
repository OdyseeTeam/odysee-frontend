# Odysee Frontend

The code that runs [odysee.com](https://odysee.com).

 <a href="https://github.com/OdyseeTeam/odysee-frontend/blob/master/LICENSE" title="MIT licensed">
   <img alt="npm" src="https://img.shields.io/dub/l/vibe-d.svg?style=flat">
 </a>
 <a href="https://chat.odysee.com">
   <img src="https://img.shields.io/discord/362322208485277697.svg?logo=discord" alt="chat on Discord">
 </a>

## Table of Contents

1. [Usage](#usage)
2. [Running from Source](#running-from-source)
3. [Contributing](#contributing)
4. [License](#license)
5. [Security](#security)

## Usage

Go to the website to interact on this frontend.

## Running from Source

### Prerequisites

<!-- Comment for this—you're literally on a Git frontend website, I'm well sure somebody who knows how to code and is using a Git platform _must_ have Git already installed. -->
<!--- [Git](https://git-scm.com/downloads)-->

- [Bun](https://bun.sh), that's it.

<!-- Link to a guide on how to fork a repo :sob: -->

1. Clone (or [fork](https://help.github.com/articles/fork-a-repo/)) this repository: `git clone https://github.com/OdyseeTeam/odysee-frontend`
2. Go into your cloned/forked directory: `cd odysee-frontend`
3. Install the dependencies needed: `bun install`

### Run the web app for development

`bun run dev`

- This uses Vite and includes hot-reloading.
- If you want to debug the [web server we use in production](https://github.com/OdyseeTeam/odysee-frontend/blob/master/web/index.js), run `bun run dev:ssr`. This starts the SSR server at `localhost:1337`.

### Customization and troubleshooting

<ul>
<details>
  <summary>Customize the web app</summary>

- In root directory, duplicate the `.env.defaults` file as `.env` and make customizations there.
  ```
  cp .env.defaults .env
  nano .env
  ```
- To specify your own OG-IMAGE:
  - Either place a png named `v2-og.png` in the `/custom` folder or specify the `OG_IMAGE_URL` in .env file.
- To specify your own channels to be followed on first run:
  - `AUTO_FOLLOW_URLS=lbry://@chan#123...a lbry://@chan2#456...a`
- To customize the homepage content:
  1. Add `CUSTOM_HOMEPAGE=true` to the .env file.
  2. Copy `/custom/homepage.example.js` to `/custom/homepage.js` and make desired changes to `homepage.js`.
- Finally, run `NODE_ENV=production bun run build` to rebuild. - _Note: You do not need to edit the `.env` file in the `/web` folder._
</details>

<details>
  <summary>Deploy the web app</summary>

1. Create a server with a domain name and a reverse proxy https to port 1337.
2. Install `pm2` and `bun`.
3. Clone/fork this repo.
4. Make any customizations as above.
5. Run `bun install`.
6. Run `NODE_ENV=production bun run build`.
7. Set up pm2 to start `./web/index.js`.
</details>

<details>
  <summary>Run with Docker</summary>

Build the production image:

```
docker build -t odysee-frontend .
```

Run it on port 1337:

```
docker run --rm -p 1337:1337 odysee-frontend
```

To override defaults at runtime, pass environment variables with `-e` or provide an env file. The image uses `.env.defaults` baked into the repo as its baseline configuration.

</details>

<details>
  <summary>Resetting your packages</summary>

If the app isn't building, or `bun` commands aren't working, you may need to reset `node_modules`. To do so you can run `rm -r node_modules && bun install` if you're on a \*NIX operating system or `rmdir /s /q node_modules && bun install` if you're on Windows.

<!-- Imagine using Windows -->

If you _really_ think something might have gone wrong, you can force your repo to clear everything that doesn't match the repo with `git reset --hard HEAD && git clean -fxd && git pull -r`

</details>

</ul>

## Contributing

We :heart: contributions from everyone and contributions to this project are encouraged, and compensated. We welcome [bug reports](https://github.com/OdyseeTeam/odysee-frontend/issues/), [bug fixes](https://github.com/OdyseeTeam/odysee-frontend/pulls) and feedback is always appreciated. For more details, see [CONTRIBUTING.md](CONTRIBUTING.md).

## [![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/OdyseeTeam/odysee-frontend/issues) [![GitHub contributors](https://img.shields.io/github/contributors/OdyseeTeam/odysee-frontend.svg)](https://GitHub.com/OdyseeTeam/odysee-frontend/graphs/contributors/)

## License

This project is MIT licensed. For the full license, see [LICENSE](LICENSE).

## Security

For security issues, please reach out to security@odysee.com
