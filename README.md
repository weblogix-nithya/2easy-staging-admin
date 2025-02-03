<p align="center"><a href="https://sprintdigital.com.au/" target="_blank"><img src="https://cms.spdig.co/wp-content/uploads/2021/11/service-software.png" width="400"></a></p>

### Domains

Staging: http://admin.2easy.2mm.cloud/
Production: https://admin.2easyfreight.com.au/ and https://customer.2easyfreight.com.au/

### GitHub Template

[Create a repo from this template on GitHub](https://github.com/sprint-digital/boilerplate-next-app/generate).

## Upstream Setup

Setup upstream link. MAKE SURE this is set up

```bash
git remote add upstream https://github.com/sprint-digital/boilerplate-next-app.git
```

Pull down latest changes

```bash
git fetch upstream
git checkout main # can be any branch.
git merge upstream/main
# if error "fatal: refusing to merge unrelated histories"
git merge upstream/main --allow-unrelated-histories
```

### Initial Setup

```bash
yarn install
```

---

## Usage

### Development

Just run and visit http://localhost:3000

```bash
yarn dev
```

### Storybook

Just run and visit http://localhost:6006

```bash
yarn storybook
```

---

### Deployment

Deploy on Vercel
Configure the environment variables and slack notifications

### Notes

- [ ] Dark mode doesn't work on Vercel (Production deployment).
- [ ] Implement Storybook better
- [x] Eslint enforced
- [ ] Generate CRUD script

---

## **Powered by:**

### Javascript

- **ReactJS -** https://reactjs.org/
- **NextJS -** https://nextjs.org/docs/getting-started
- **GraphQL -** https://graphql.org/
- **Apollo -** https://www.apollographql.com/
- **Typescript -** https://www.typescriptlang.org/
- **Lodash.debounce -** https://www.npmjs.com/package/lodash.debounce

### Testing/Tools

- **Jest -** https://jestjs.io/
- **Web Vitals -** https://www.npmjs.com/package/web-vitals
- **Storybook -** https://storybook.js.org/ (Documentation for components)

### Style Handling

- **TailwindCSS 3 -** https://tailwindcss.com/docs/installation (Prebuilt css classes)
- **Emotion (react) -** https://emotion.sh/docs/introduction
- **Stylis -** https://github.com/thysultan/stylis
- **Framer Motion -** https://www.framer.com/motion/ (Animation library)

### Prebuilt Elements

- **Chakra -** https://chakra-ui.com/getting-started/nextjs-guide (Component/element blocks)
- **Chakra icons -** https://chakra-ui.com/docs/components/icon#using-chakra-ui-icons
- **Chakra Select -** https://www.npmjs.com/package/chakra-react-select (select element)
- **Apexcharts -** https://apexcharts.com/ (charts)
- **Calendar Input -** https://www.npmjs.com/package/react-calendar (calendar input)
- **Custom Scrollbars 2 -** https://github.com/RobPethick/react-custom-scrollbars-2
- **React Table -** https://react-table-v7.tanstack.com/
- **React Dropzone -** https://react-dropzone.js.org/ (drag and drop area for user uploads)
- **React Icons -** https://react-icons.github.io/react-icons (Large collection of various icons)
