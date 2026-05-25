import { Injectable } from '@angular/core';
import { CardBlock, parseCardBlocks } from '../../shared/utils/card-parser';

export interface CardImageData {
  questionText: string;
  categoryName: string;
  categoryColor: string;
  cardNumber: number;
}

const WIDTH = 1080;
const PAD = 60;
const CARD_PAD = 40;
const CARD_LEFT_BORDER = 6;
const CARD_INNER_LEFT = PAD + CARD_LEFT_BORDER + CARD_PAD;
const CARD_INNER_RIGHT = WIDTH - PAD - CARD_PAD;
const TEXT_WIDTH = CARD_INNER_RIGHT - CARD_INNER_LEFT;
const BG_COLOR = '#1a1a2e';
const CARD_BG = '#16213e';
const TEXT_COLOR = '#eaeaea';
const MUTED_COLOR = '#8888aa';

@Injectable({ providedIn: 'root' })
export class CardImageService {

  async generate(data: CardImageData): Promise<Blob> {
    const blocks = parseCardBlocks(data.questionText);
    const height = this.measureHeight(blocks);
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    this.drawBackground(ctx, height);
    this.drawCardBody(ctx, data.categoryColor, height);
    this.drawCornerLogo(ctx);
    this.drawHeader(ctx, data, height);
    this.drawBlocks(ctx, blocks, data.categoryColor);
    this.drawFooter(ctx, height);

    return new Promise(resolve =>
      canvas.toBlob(blob => resolve(blob!), 'image/png')
    );
  }

  private measureHeight(blocks: CardBlock[]): number {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    let y = PAD + CARD_PAD + 50; // top padding + card padding + header

    for (const block of blocks) {
      y += this.measureBlock(ctx, block);
    }

    y += CARD_PAD + PAD + 100; // card bottom pad + outer pad + footer
    return Math.max(800, Math.min(1600, y));
  }

  private measureBlock(ctx: CanvasRenderingContext2D, block: CardBlock): number {
    switch (block.type) {
      case 'title':
        ctx.font = 'bold 42px Poppins, sans-serif';
        return this.wrapText(ctx, block.content, TEXT_WIDTH).length * 56 + 16;
      case 'text':
        ctx.font = '34px Inter, sans-serif';
        return this.wrapText(ctx, block.content, TEXT_WIDTH).length * 48 + 8;
      case 'bullet':
        ctx.font = '32px Inter, sans-serif';
        return this.wrapText(ctx, block.content, TEXT_WIDTH - 40).length * 46 + 8;
      case 'divider':
        return 28;
      case 'philosopher':
        ctx.font = 'bold 30px Poppins, sans-serif';
        const nameLines = 1;
        ctx.font = '32px Inter, sans-serif';
        const textLines = this.wrapText(ctx, block.content, TEXT_WIDTH).length;
        return nameLines * 42 + textLines * 46 + 16;
    }
  }

  private drawBackground(ctx: CanvasRenderingContext2D, h: number): void {
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, WIDTH, h);
  }

  private drawCardBody(ctx: CanvasRenderingContext2D, color: string, h: number): void {
    const top = PAD;
    const bottom = h - PAD - 66;
    const left = PAD;
    const right = WIDTH - PAD;
    const r = 24;
    const cardW = right - left;
    const cardH = bottom - top;

    // Clip to rounded rect so the color border respects corners
    ctx.save();
    this.roundRect(ctx, left, top, cardW, cardH, r);
    ctx.clip();

    // Card background
    ctx.fillStyle = CARD_BG;
    ctx.fillRect(left, top, cardW, cardH);

    // Left color border — simple rect, clipped to rounded shape
    ctx.fillStyle = color;
    ctx.fillRect(left, top, CARD_LEFT_BORDER, cardH);

    ctx.restore();
  }

  private drawHeader(ctx: CanvasRenderingContext2D, data: CardImageData, _h: number): void {
    const y = PAD + CARD_PAD + 36;
    ctx.font = '600 28px Poppins, sans-serif';
    ctx.fillStyle = MUTED_COLOR;
    const label = `#${data.cardNumber}  ·  ${data.categoryName}`;
    ctx.fillText(label, CARD_INNER_LEFT, y);
  }

  private drawBlocks(ctx: CanvasRenderingContext2D, blocks: CardBlock[], color: string): void {
    let y = PAD + CARD_PAD + 80;

    for (const block of blocks) {
      y = this.drawBlock(ctx, block, y, color);
    }
  }

  private drawBlock(ctx: CanvasRenderingContext2D, block: CardBlock, y: number, color: string): number {
    switch (block.type) {
      case 'title': {
        ctx.font = 'bold 42px Poppins, sans-serif';
        ctx.fillStyle = color;
        const lines = this.wrapText(ctx, block.content, TEXT_WIDTH);
        for (const line of lines) {
          y += 56;
          ctx.fillText(line, CARD_INNER_LEFT, y);
        }
        return y + 16;
      }
      case 'text': {
        ctx.font = '34px Inter, sans-serif';
        ctx.fillStyle = TEXT_COLOR;
        ctx.globalAlpha = 0.9;
        const lines = this.wrapText(ctx, block.content, TEXT_WIDTH);
        for (const line of lines) {
          y += 48;
          ctx.fillText(line, CARD_INNER_LEFT, y);
        }
        ctx.globalAlpha = 1;
        return y + 8;
      }
      case 'bullet': {
        ctx.font = '32px Inter, sans-serif';
        ctx.fillStyle = TEXT_COLOR;
        ctx.globalAlpha = 0.85;
        const lines = this.wrapText(ctx, block.content, TEXT_WIDTH - 40);
        ctx.globalAlpha = 0.5;
        ctx.fillText('•', CARD_INNER_LEFT, y + 46);
        ctx.globalAlpha = 0.85;
        for (const line of lines) {
          y += 46;
          ctx.fillText(line, CARD_INNER_LEFT + 40, y);
        }
        ctx.globalAlpha = 1;
        return y + 8;
      }
      case 'divider': {
        y += 14;
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.2;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(CARD_INNER_LEFT, y);
        ctx.lineTo(CARD_INNER_RIGHT, y);
        ctx.stroke();
        ctx.globalAlpha = 1;
        return y + 14;
      }
      case 'philosopher': {
        ctx.font = 'bold 30px Poppins, sans-serif';
        ctx.fillStyle = color;
        y += 42;
        ctx.fillText(block.name ?? '', CARD_INNER_LEFT, y);

        ctx.font = '32px Inter, sans-serif';
        ctx.fillStyle = TEXT_COLOR;
        ctx.globalAlpha = 0.85;
        const lines = this.wrapText(ctx, block.content, TEXT_WIDTH);
        for (const line of lines) {
          y += 46;
          ctx.fillText(line, CARD_INNER_LEFT, y);
        }
        ctx.globalAlpha = 1;
        return y + 16;
      }
    }
  }

  private drawCornerLogo(ctx: CanvasRenderingContext2D): void {
    this.drawOrbitLogo(ctx, WIDTH - PAD - 44, PAD + 38, 40);
  }

  private drawFooter(ctx: CanvasRenderingContext2D, h: number): void {
    // CTA line — closer to the card bottom
    const ctaY = h - 68;
    ctx.font = '26px Inter, sans-serif';
    ctx.fillStyle = MUTED_COLOR;
    ctx.globalAlpha = 0.6;
    ctx.textAlign = 'center';
    ctx.fillText('Find more great questions @', WIDTH / 2, ctaY);
    ctx.globalAlpha = 1;

    // Brand name — more space below CTA
    const brandY = h - 24;
    ctx.font = '600 30px Poppins, sans-serif';
    ctx.fillStyle = TEXT_COLOR;
    ctx.textAlign = 'center';
    ctx.fillText('Thinking.Cards', WIDTH / 2, brandY);

    ctx.textAlign = 'start';
  }

  private drawOrbitLogo(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
    const scale = size / 48;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.strokeStyle = MUTED_COLOR;
    ctx.fillStyle = MUTED_COLOR;

    // Outer ring
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 18, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Tilted orbit
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 8, -Math.PI / 6, 0, Math.PI * 2);
    ctx.stroke();

    // Orbiting dot 1
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(-13, -10, 3, 0, Math.PI * 2);
    ctx.fill();

    // Orbiting dot 2
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(13, 10, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Nucleus
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';

    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines.length ? lines : [''];
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
}
