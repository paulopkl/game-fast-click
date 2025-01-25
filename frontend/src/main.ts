import { bootstrapApplication } from '@angular/platform-browser'
import { appConfig } from './app/app.config'
import { AppComponent } from './app/app.component'

// console.log('API_URL:', process.env['API_URL']);

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err))
