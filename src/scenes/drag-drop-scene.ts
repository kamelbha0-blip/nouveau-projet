import * as Phaser from 'phaser';
import { SCENE_KEYS } from './scene-keys';
import { ASSET_KEYS } from '../common/assets';
import { CUSTOM_EVENTS, EVENT_BUS } from '../common/event-bus';
import { DEFAULT_UI_TEXT_STYLE } from '../common/common';

interface DragItem {
  id: string;
  text: string;
}

interface DropZone {
  id: string;
  label: string;
}

interface CorrectMatch {
  dragId: string;
  dropId: string;
}

interface DragDropQuestion {
  id: number;
  type: 'drag_drop';
  question: string;
  dragItems: DragItem[];
  dropZones: DropZone[];
  correctMatches: CorrectMatch[];
  feedbackCorrect: string;
  feedbackWrong: string;
}

export class DragDropScene extends Phaser.Scene {
  #question!: DragDropQuestion;
  // maps dropZone id -> dragItem id placed there
  #placements: Map<string, string> = new Map();
  // maps dragItem id -> its label game object
  #dragLabels: Map<string, Phaser.GameObjects.Text> = new Map();
  // maps dropZone id -> its zone game object
  #dropZoneObjects: Map<string, Phaser.GameObjects.Zone> = new Map();
  // currently dragged item id
  #dragging: string | null = null;
  #dragOffsetX = 0;
  #dragOffsetY = 0;
  #feedbackText!: Phaser.GameObjects.Text;
  #confirmButton!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SCENE_KEYS.DRAG_DROP_SCENE });
  }

  public init(data: { question: DragDropQuestion }): void {
    this.#question = data.question;
    this.#placements = new Map();
    this.#dragLabels = new Map();
    this.#dropZoneObjects = new Map();
    this.#dragging = null;
  }

  public create(): void {
    const W = this.scale.width;   // 256
    const H = this.scale.height;  // 224

    // dark overlay
    this.add.rectangle(0, 0, W, H, 0x000000, 0.75).setOrigin(0);

    // question text
    this.add.text(W / 2, 12, this.#question.question, {
      ...DEFAULT_UI_TEXT_STYLE,
      wordWrap: { width: W - 20 },
      align: 'center',
    }).setOrigin(0.5, 0);

    // --- Drop zones (right side) ---
    const zoneX = 148;
    const zoneStartY = 50;
    const zoneH = 30;
    const zoneW = 96;
    const zoneGap = 8;

    this.#question.dropZones.forEach((dz, i) => {
      const y = zoneStartY + i * (zoneH + zoneGap);

      // background rect
      this.add.rectangle(zoneX, y, zoneW, zoneH, 0x334455).setOrigin(0);
      this.add.rectangle(zoneX, y, zoneW, zoneH).setStrokeStyle(1, 0x88aacc).setOrigin(0);

      // label
      this.add.text(zoneX + zoneW / 2, y + zoneH / 2, dz.label, {
        ...DEFAULT_UI_TEXT_STYLE,
        fontSize: 6,
        wordWrap: { width: zoneW - 4 },
        align: 'center',
      }).setOrigin(0.5, 0.5);

      // interactive zone
      const zone = this.add.zone(zoneX, y, zoneW, zoneH).setOrigin(0).setInteractive();
      this.#dropZoneObjects.set(dz.id, zone);

      zone.on('pointerup', () => {
        if (this.#dragging !== null) {
          this.#dropItem(dz.id);
        }
      });
    });

    // --- Drag items (left side) ---
    const itemX = 16;
    const itemStartY = 55;
    const itemH = 22;
    const itemW = 80;
    const itemGap = 14;

    this.#question.dragItems.forEach((item, i) => {
      const y = itemStartY + i * (itemH + itemGap);

      const bg = this.add.rectangle(itemX, y, itemW, itemH, 0x556633).setOrigin(0).setInteractive({ draggable: false });
      const label = this.add.text(itemX + itemW / 2, y + itemH / 2, item.text, {
        ...DEFAULT_UI_TEXT_STYLE,
        fontSize: 7,
      }).setOrigin(0.5, 0.5);

      this.#dragLabels.set(item.id, label);

      // store original position on the label for reset
      (label as any).__origX = label.x;
      (label as any).__origY = label.y;
      (bg as any).__origX = bg.x;
      (bg as any).__origY = bg.y;
      (bg as any).__itemId = item.id;
      (bg as any).__label = label;

      bg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        this.#dragging = item.id;
        this.#dragOffsetX = pointer.x - bg.x;
        this.#dragOffsetY = pointer.y - bg.y;
        bg.setDepth(10);
        label.setDepth(11);
      });

      bg.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        if (this.#dragging === item.id) {
          bg.setPosition(pointer.x - this.#dragOffsetX, pointer.y - this.#dragOffsetY);
          label.setPosition(bg.x + itemW / 2, bg.y + itemH / 2);
        }
      });

      bg.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (this.#dragging === item.id) {
          // check if dropped on a zone
          const dropped = this.#findDropZoneAt(pointer.x, pointer.y);
          if (dropped) {
            this.#dropItem(dropped);
          } else {
            // snap back
            bg.setPosition((bg as any).__origX, (bg as any).__origY);
            label.setPosition(bg.x + itemW / 2, bg.y + itemH / 2);
            this.#dragging = null;
          }
          bg.setDepth(0);
          label.setDepth(1);
        }
      });
    });

    // --- Confirm button ---
    this.#confirmButton = this.add.text(W / 2, H - 18, 'Valider', {
      ...DEFAULT_UI_TEXT_STYLE,
      fontSize: 8,
      backgroundColor: '#224422',
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setInteractive();

    this.#confirmButton.on('pointerdown', () => this.#checkAnswer());

    // --- Feedback text (hidden) ---
    this.#feedbackText = this.add.text(W / 2, H - 36, '', {
      ...DEFAULT_UI_TEXT_STYLE,
      fontSize: 7,
      align: 'center',
      wordWrap: { width: W - 20 },
    }).setOrigin(0.5).setVisible(false);

    // global pointer up to cancel drag
    this.input.on('pointerup', () => {
      this.#dragging = null;
    });
  }

  #findDropZoneAt(px: number, py: number): string | null {
    for (const [id, zone] of this.#dropZoneObjects.entries()) {
      const b = zone.getBounds();
      if (px >= b.left && px <= b.right && py >= b.top && py <= b.bottom) {
        return id;
      }
    }
    return null;
  }

  #dropItem(dropZoneId: string): void {
    if (this.#dragging === null) return;
    const dragId = this.#dragging;

    // remove previous occupant from this zone if any
    for (const [zId, dId] of this.#placements.entries()) {
      if (zId === dropZoneId) {
        this.#placements.delete(zId);
        // snap that item back
        this.#snapItemBack(dId);
        break;
      }
    }

    // if this item was already placed somewhere, free that zone
    for (const [zId, dId] of this.#placements.entries()) {
      if (dId === dragId) {
        this.#placements.delete(zId);
        break;
      }
    }

    this.#placements.set(dropZoneId, dragId);
    this.#dragging = null;

    // snap item visually to zone center
    const zone = this.#dropZoneObjects.get(dropZoneId)!;
    const b = zone.getBounds();
    const label = this.#dragLabels.get(dragId)!;
    const bg = this.#findBgForItem(dragId);
    if (bg) {
      bg.setPosition(b.left, b.top);
      label.setPosition(b.left + b.width / 2, b.top + b.height / 2);
      bg.setDepth(0);
      label.setDepth(1);
    }
  }

  #snapItemBack(dragId: string): void {
    const label = this.#dragLabels.get(dragId);
    const bg = this.#findBgForItem(dragId);
    if (bg && label) {
      bg.setPosition((bg as any).__origX, (bg as any).__origY);
      label.setPosition(bg.x + 40, bg.y + 11);
    }
  }

  #findBgForItem(dragId: string): Phaser.GameObjects.Rectangle | null {
    for (const obj of this.children.list) {
      if ((obj as any).__itemId === dragId) {
        return obj as Phaser.GameObjects.Rectangle;
      }
    }
    return null;
  }

  #checkAnswer(): void {
    if (this.#placements.size < this.#question.dragItems.length) {
      this.#feedbackText.setText('Place tous les animaux !').setVisible(true);
      return;
    }

    const isCorrect = this.#question.correctMatches.every(
      (match) => this.#placements.get(match.dropId) === match.dragId,
    );

    const feedback = isCorrect ? this.#question.feedbackCorrect : this.#question.feedbackWrong;
    this.#feedbackText.setText(feedback).setVisible(true);
    this.#confirmButton.setVisible(false);

    this.time.delayedCall(2000, () => {
      EVENT_BUS.emit(CUSTOM_EVENTS.QUIZ_RESULT, { correct: isCorrect });
      this.scene.stop();
    });
  }
}
