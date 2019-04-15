# Auction Service using web socket.io
Real-time auction application using web socket.io 

### Node Version
v.11.10.0

### Dependancy Install
```
$ npm install
$ npm install -D nodemon
```

### Environment Configuration
* Database: MySQL(version 5.7)

  ##### * Database creation CLI(sequelize-cli)
  ```
  $ sequelize db:create
  ```

* .env file configuration(dir=./)
  - COOKIE_SECRET=auction
  - PORT=8086
  
### Server Execution Script
```
$ npm start
```
<br />


> ESLint Configuration(optional)
```
$ npm install -g eslint eslint-config-airbnb-base eslint-plugin-import
```