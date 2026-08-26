# Contribute to Odysee

**Firstly**, if you're unsure or afraid of anything, just ask or submit the
issue or pull request anyways. You won't be yelled at for giving your best
effort. The worst that can happen is that you'll be politely asked to change
something. We appreciate any sort of contributions, and don't want a wall of
rules to get in the way of that.

However, for those individuals who want a bit more guidance on the best way to
contribute to the project, read on. This document will cover what we're looking
for. By addressing all the points we're looking for, it raises the chances we can
quickly merge or address your contributions.

## TL;DR?

- [Here](https://github.com/OdyseeTeam/odysee-frontend/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22+no%3Aassignee)
  is a list of help wanted issues.
- Comment on an issue to let us know if you are going to work on it, don't take
  an issue that someone reserved less than 3 days ago.
- Don't hesitate to contact us with any questions or comments via [our Discord server](https://chat.odysee.com).

## Contents

- [Choose an Issue](#choose-an-issue)
- [Code Overview](#code-overview)
  - [Lint](#lint)
  - [Code Formatting](#code-formatting)
  - [Debug](#debug)
- [Submit a Pull Request](#submit-a-pull-request)

## Choose an issue

The frontend for Odysee is an open source project and therefore is developed out
in the open for everyone to see. What you see here are the latest source code
changes and issues.

Since Odysee is based on a decentralized community, we believe that the website
will be stronger if it receives contributions from individuals outside the core
team — such as yourself!

To make contributing as easy and rewarding as possible, we have instituted the
following system:

- Anyone can view all issues in the system by clicking on the
  [Issues](https://github.com/OdyseeTeam/odysee-frontend/issues) button at the
  top of the page. Feel free to add an issue if you think we have missed
  something.
- Once on the [Issues](https://github.com/OdyseeTeam/odysee-frontend/issues)
  page, you can filter issues by the
  [Help Wanted (in progress)](https://github.com/OdyseeTeam/odysee-frontend/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22+no%3Aassignee)
  label to see a curated list of suggested issues with which community members
  can help.
- Every
  [Help Wanted](https://github.com/OdyseeTeam/odysee-frontend/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22+no%3Aassignee)
  issue is ranked on a scale from zero to four (in progress)

| Level (in progress)                                                                                                                                         | Description                                                                                         |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [**level 0**](https://github.com/OdyseeTeam/odysee-frontend/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22+label%3A%22level%3A+0%22+no%3Aassignee) | Typos and text edits -- a tech-savvy non-programmer can fix these.                                  |
| [**level 1**](https://github.com/OdyseeTeam/odysee-frontend/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22+label%3A%22level%3A+1%22+no%3Aassignee) | Programming issues that require little knowledge of how the Odysee app works.                       |
| [**level 2**](https://github.com/OdyseeTeam/odysee-frontend/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22+label%3A%22level%3A+2%22+no%3Aassignee) | Issues of average difficulty that require the developer to dig into how the app works a little bit. |
| [**level 3**](https://github.com/OdyseeTeam/odysee-frontend/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22+label%3A%22level%3A+3%22+no%3Aassignee) | Issues that are likely too tricky to be level 2 or require more thinking outside of the box.        |
| [**level 4**](https://github.com/OdyseeTeam/odysee-frontend/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22+label%3A%22level%3A+4%22+no%3Aassignee) | Big features or really hard issues.                                                                 |

The process of ranking issues is highly subjective. The purpose of sorting issues
like this is to give contributors a general idea about the type of issues they are
looking at. For instance, it could very well be the case that a level 1 issue is
more difficult than a level 2 issue. This system is meant to help you find
relevant issues, not to prevent you from working on issues that you otherwise
would. If these rankings don't work for you, feel free to ignore them.

Although all contributions should have good UX, the
[UX label, when applied in conjunction with Help Wanted](https://github.com/OdyseeTeam/odysee-frontend/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22+label%3Aux+no%3Aassignee),
indicates that the contributor ought to implement the feature in a creative way
that specifically focuses on providing a good user experience. These issues often
have no set instruction for how the experience should be and leave it to the
contributor to figure out. This may be challenging for people who do not like UX,
but also more fun and rewarding for those who do.

## Code Overview

This application is primarily written in TypeScript, utilizing
[React](https://reactjs.org) and [Redux](https://redux.js.org) for UI and
application state.

The project comes with diverse tools for simplifying the development process and
for providing better code quality. It's recommended to make use of them
thoroughly during ongoing development.

### Lint

Code linting is ensured by [oxlint](https://github.com/oxc-project/oxc).

You can lint all the project's sources at any time by running:

```sh
pnpm lint
```

Staged files are automatically linted before commit. Please take the time to fix
all staged files' linting problems before committing or suppress them if
necessary.

If you want the linting problems to show up on your IDE or text editor, check
out [Oxlint's supported editors](https://oxc.rs/docs/guide/usage/linter/editors.html).

### Code Formatting

<!-- Via the vite-plus plugin -->

Project's sources are formatted using [oxfmt](https://github.com/oxc-project/oxc).

Staged files are automatically formatted before commit via the pre-commit hook.

You can also use the following command:

```sh
pnpm fmt
```

for applying formatting rules to the entire project's code. For formatting a
specific file or directory, use:

```sh
pnpm fmt 'glob/pattern'
```

If you also want IDE integration, check out
[Oxfmt's supported editors](https://oxc.rs/docs/guide/usage/formatter/editors.html).

### Debug

There are a few tools integrated to the project that will ease the process of
debugging:

- [Chrome DevTools](https://developer.chrome.com/docs/devtools)
  - Also available for the main process as a
    [remote target](chrome://inspect/#devices).
- [Vite DevTools](https://devtools.vite.dev)

## Submit a Pull Request

After deciding what to work on, you can fork this repository, make your changes,
and submit a pull request.

- A contributor wanting to reserve an issue in advance can leave a comment
  saying that they're working on it. Contributors should respect other people's
  efforts to complete issues in a timely manner and, therefore, not begin working
  on anything reserved (or updated) within the last 3 days. If someone has been
  officially assigned an issue via GitHub's assignment system, it is also not
  available. Contributors are encouraged to ask if they have any questions about
  issue availability.
- Once the pull request is visible, a team member will review it and make sure
  it is up to our standards. At this point, the contributor may have to change
  their code based on our suggestions and comments.
- Then, upon a satisfactory review of the code, we'll merge it.

We're here to enable you. We want you to succeed, so do not hesitate to ask
questions. If you need some information or assistance in completing an issue,
please let us know! That is what we are here for— pushing development forward.

Lastly, don't feel limited by this list. Should Odysee have built-in Tor
support? **Add it!** It's not in the issue tracker, but maybe it's a good idea. Do
you think the search layout is unintuitive? **Change it!** We welcome all feedback
and suggestions. That said, it may be the case that we do not wish to incorporate
your change if you don't check with us first (also, please check with us especially
if you are planning on adding Tor support :P). If you want to add a feature that
is not listed in the issue tracker, go ahead and
[create an issue](https://github.com/OdyseeTeam/odysee-frontend/issues/new), and
say in the description that you would like to try to implement it yourself. This
way we can tell you in advance if we will accept your changes and we can point you
in the right direction.
