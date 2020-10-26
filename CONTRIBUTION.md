
# Contributing to Videx Map

In general, we follow the "fork-and-pull" Git workflow.

1. Fork the repo on GitHub
2. Clone the project to your own machine
3. Work on your fork
    1. Make your changes and additions
        - Most of your changes should be focused on `src/` and `test/` folders and/or `README.md`, if applicable, please provide an example under `.storybook/src`.
    2. Change or add tests if needed
    3. Run tests and make sure they pass
    4. Add changes to README.md if needed
4. Commit changes to your own branch
5. **Make sure** you merge the latest from "upstream" and resolve conflicts if there is any
6. Repeat step 3(3) above
7. Push your work back up to your fork
8. Submit a Pull request so that we can review your changes

## Setup

### Clone repository
`git clone https://github.com/equinor/videx-map.git`

### Install
`npm install`

### Run storybook
`npm start` - Will start a local instance of storybook with visual examples

### Tests

`npm test` - Runs through all tests

`npm run test:Watch` - Runs through all tests and listen to changes (and re-runs tests)

### Documentation
`npm run docs` - This will generate documentation based on your current code

NOTE: Any changes you have not commited will also be a part of the documentation
