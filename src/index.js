import "@babel/polyfill";

import app from './app';

async function main(){
    app.set('port',process.env.PORT || 4000);
    await app.listen(app.get('port'));
    console.log(`< Server on port ${app.get('port')} >`);
}
main();