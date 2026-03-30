import * as Phaser from 'phaser';
import { SCENE_KEYS } from './scene-keys';
import { ASSET_KEYS } from '../common/assets';
import { CUSTOM_EVENTS, EVENT_BUS } from '../common/event-bus';
import { DEFAULT_UI_TEXT_STYLE } from '../common/common';

interface QuestionOption {
  id: string;
  text: string;
}

interface Question {
  id: number;
  type?: string;
  difficulty?: string;
  timer?: number;
  points?: number;
  question: string;
  image?: string;
  audio?: string;
  options?: QuestionOption[];
  correctAnswer?: string;
  feedbackCorrect?: string;
  feedbackWrong?: string;
  answer?: boolean; // For questions.json
}

export class QuizScene extends Phaser.Scene {
  #allQuestions: Question[] = [];
  #currentQuestion!: Question;
  #dialogContainer!: Phaser.GameObjects.Container;
  #questionText!: Phaser.GameObjects.Text;
  #optionTexts: Phaser.GameObjects.Text[] = [];
  #cursor!: Phaser.GameObjects.Image;
  #selectedOptionIndex: number = 0;
  #controls!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    enter: Phaser.Input.Keyboard.Key;
    space: Phaser.Input.Keyboard.Key;
  };

  constructor() {
    super({
      key: SCENE_KEYS.QUIZ_SCENE,
    });
  }

  public create(): void {
    this.#optionTexts = []; // Réinitialiser le tableau des options
    this.#selectedOptionIndex = 0; // Réinitialiser l'index

    // Load both question sets
    const qcmQuestions = this.cache.json.get(ASSET_KEYS.QCM) as Question[];
    const simpleQuestions = this.cache.json.get(ASSET_KEYS.QUESTIONS) as Question[];

    // Normalize simple questions to QCM format
    const normalizedSimpleQuestions: Question[] = simpleQuestions.map((q) => ({
      id: q.id,
      type: 'multiple_choice',
      question: q.question,
      options: [
        { id: 'true', text: 'Vrai' },
        { id: 'false', text: 'Faux' },
      ],
      correctAnswer: q.answer ? 'true' : 'false',
      feedbackCorrect: 'Correct !',
      feedbackWrong: 'Faux !',
    }));

    // Combine all questions
    this.#allQuestions = [...qcmQuestions, ...normalizedSimpleQuestions];
    this.#currentQuestion = Phaser.Utils.Array.GetRandom(this.#allQuestions);

    // Create background/overlay
    this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.5).setOrigin(0);

    // Create dialog container
    this.#dialogContainer = this.add.container(32, 50);
    const dialogBg = this.add.image(0, 0, ASSET_KEYS.UI_DIALOG, 0).setOrigin(0);
    dialogBg.setDisplaySize(200, 160);
    this.#dialogContainer.add(dialogBg);

    // Question text
    this.#questionText = this.add.text(10, 10, this.#currentQuestion.question, {
      ...DEFAULT_UI_TEXT_STYLE,
      wordWrap: { width: 180 }
    }).setOrigin(0);
    this.#dialogContainer.add(this.#questionText);

    // Options
    const options = this.#currentQuestion.options || [];
    options.forEach((option, index) => {
      const optionText = this.add.text(30, 60 + index * 25, option.text, {
        ...DEFAULT_UI_TEXT_STYLE,
        wordWrap: { width: 160 }
      }).setOrigin(0);
      this.#optionTexts.push(optionText);
      this.#dialogContainer.add(optionText);
    });

    // Cursor
    this.#cursor = this.add.image(20, 0, ASSET_KEYS.UI_CURSOR).setOrigin(0.5);
    this.#dialogContainer.add(this.#cursor);

    // Controls
    if (!this.input.keyboard) {
      throw new Error('Keyboard input is required for QuizScene');
    }

    this.#controls = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      enter: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
      space: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    };

    this.#updateCursorPosition();
  }

  public update(): void {
    if (!this.input.keyboard) {
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.#controls.up)) {
      this.#selectedOptionIndex = (this.#selectedOptionIndex - 1 + this.#optionTexts.length) % this.#optionTexts.length;
      this.#updateCursorPosition();
    } else if (Phaser.Input.Keyboard.JustDown(this.#controls.down)) {
      this.#selectedOptionIndex = (this.#selectedOptionIndex + 1) % this.#optionTexts.length;
      this.#updateCursorPosition();
    } else if (Phaser.Input.Keyboard.JustDown(this.#controls.enter) || Phaser.Input.Keyboard.JustDown(this.#controls.space)) {
      this.#handleAnswer();
    }
  }

  #updateCursorPosition(): void {
    if (this.#optionTexts.length === 0) return;
    const selectedText = this.#optionTexts[this.#selectedOptionIndex];
    this.#cursor.setX(selectedText.x - 10);
    this.#cursor.setY(selectedText.y + 8);
  }

  #handleAnswer(): void {
    if (this.#optionTexts.length === 0 || !this.#cursor.visible) {
      return;
    }

    const options = this.#currentQuestion.options || [];
    const selectedOption = options[this.#selectedOptionIndex];
    const isCorrect = selectedOption.id === this.#currentQuestion.correctAnswer;
    
    // Feedback text
    const feedback = isCorrect 
      ? (this.#currentQuestion.feedbackCorrect || 'Correct !') 
      : (this.#currentQuestion.feedbackWrong || 'Faux !');
      
    this.#questionText.setText(feedback);
    this.#optionTexts.forEach(t => t.visible = false);
    this.#cursor.visible = false;

    this.time.delayedCall(2000, () => {
      EVENT_BUS.emit(CUSTOM_EVENTS.QUIZ_RESULT, { correct: isCorrect });
      this.scene.stop();
    });
  }
}
