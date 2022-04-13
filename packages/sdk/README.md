# @platohq/nestjs-analytics

The NestJS module for Segment based on the official analytics-node package

## How to install

```
npm install @platohq/nestjs-analytics
```

or

```
yarn add @platohq/nestjs-analytics
```

## How to use

**Register the module**

```
import { AnalyticsModule } from '@platohq/nestjs-analytics';

@Module({
  imports: [
    AnalyticsModule.register({
      writeKey: 'YOUR_WRITE_KEY',
    }),
  ],
})
export class AppModule {}
```

**Inject the service**

```
import { AnalyticsService } from '@platohq/nestjs-analytics';

@Injectable()
export class AppService {
  constructor(private readonly analyticsService: AnalyticsService) {}

  track() {
    this.analyticsService.track('MY_EVENT');
  }
}
```

## Async options

Quite often you might want to asynchronously pass your module options instead of passing them beforehand. In such case, use `registerAsync()` method, that provides a couple of various ways to deal with async data.

### Use factory

```
AnalyticsModule.registerAsync({
  useFactory: () => ({
    writeKey: 'YOUR_WRITE_KEY',
  }),
});
```

### Use class

```
AnalyticsModule.registerAsync({
  useClass: AnalyticsConfigService,
});
```

Above construction will instantiate `AnalyticsConfigService` inside `AnalyticsModule` and will leverage it to create options object.

```
class AnalyticsConfigService implements AnalyticsOptionsFactory {
  createAnalyticsOptions(): AnalyticsModuleOptions {
    return {
      writeKey: 'YOUR_WRITE_KEY',
    };
  }
}
```

### Use existing

```
AnalyticsModule.registerAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
}),
```
