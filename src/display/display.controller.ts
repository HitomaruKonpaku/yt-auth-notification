import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';

@Controller()
export class DisplayController {
  private indexHtml: string;

  constructor() {
    this.indexHtml = readFileSync(join(__dirname, 'views', 'index.hbs'), 'utf8');
  }

  @Get()
  index(@Res() res: Response) {
    const version = process.env.VERSION || 'dev';
    const html = this.indexHtml.replace('{{VERSION}}', version);
    res.type('html').send(html);
  }
}
