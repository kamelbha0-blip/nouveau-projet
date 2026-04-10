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
<<<<<<< HEAD
  answer?: boolean; // For questions.json
}

=======
  answer?: boolean;
}

// Layout constants for the True/False dialog image (original 1536x1024, displayed at 256x171)
// Question zone (white/cream): orig y=80..500  → scaled cx=132 cy=48  w=177 h=70
// GREEN box (Vrai, left):      orig y=648..773 → scaled cx=79  cy=118 w=78  h=21
// RED box   (Faux, right):     orig y=640..795 → scaled cx=177 cy=120 w=79  h=26
const TF_DIALOG = {
  WIDTH: 256,
  HEIGHT: 171,
  QUESTION_X: 132,
  QUESTION_CY: 48,
  QUESTION_W: 160,
  // Vrai = green (left), Faux = red (right)
  ANSWERS: [
    { cx: 79,  cy: 118, w: 70 },  // VRAI — green box
    { cx: 177, cy: 120, w: 70 },  // FAUX — red box
  ],
} as const;
// Zones measured precisely from pixel analysis of the source image
// Question beige: orig y=103..420 → scaled top=17 bot=70 cy=44  w=209
// Green box:      orig y=414..510 → scaled top=69 bot=85 cy=77  w=140
// Blue box:       orig y=557..631 → scaled top=93 bot=105 cy=99 w=142
// Red box:        orig y=630..790 → scaled top=105 bot=132 cy=119 w=152
const QCM_DIALOG = {
  WIDTH: 256,
  HEIGHT: 171,
  // Question text zone — large beige rectangle, centered vertically in the zone
  QUESTION_X: 128,   // horizontal center (cx=135 but image is slightly off-center, 128 looks better)
  QUESTION_CY: 44,   // vertical center of beige zone
  QUESTION_W: 190,   // wrap width (safe margin inside 209px zone)
  QUESTION_H: 50,    // height of zone for font-size clamping reference
  // Answer boxes — vert, bleu, rouge (in order), all centered
  ANSWERS: [
    { cx: 128, cy: 77 },   // VERT  (green box, h=16)
    { cx: 128, cy: 99 },   // BLEU  (blue box,  h=12)
    { cx: 128, cy: 119 },  // ROUGE (red box,   h=27)
  ],
  ANSWER_W: 130,   // wrap width for answer text inside each box
} as const;

>>>>>>> e2ec2cf (initial commit)
export class QuizScene extends Phaser.Scene {
  #allQuestions: Question[] = [];
  #currentQuestion!: Question;
  #dialogContainer!: Phaser.GameObjects.Container;
  #questionText!: Phaser.GameObjects.Text;
  #optionTexts: Phaser.GameObjects.Text[] = [];
  #cursor!: Phaser.GameObjects.Image;
  #selectedOptionIndex: number = 0;
<<<<<<< HEAD
  #controls!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
=======
  #isQcm: boolean = false;
  #controls!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
>>>>>>> e2ec2cf (initial commit)
    enter: Phaser.Input.Keyboard.Key;
    space: Phaser.Input.Keyboard.Key;
  };

  constructor() {
<<<<<<< HEAD
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
=======
    super({ key: SCENE_KEYS.QUIZ_SCENE });
  }

  public create(): void {
    this.#optionTexts = [];
    this.#selectedOptionIndex = 0;

    const qcmQuestions = this.cache.json.get(ASSET_KEYS.QCM) as Question[];
    const simpleQuestions = this.cache.json.get(ASSET_KEYS.QUESTIONS) as Question[];

    const normalizedSimpleQuestions: Question[] = simpleQuestions.map((q) => ({
      id: q.id,
      type: 'true_false',
>>>>>>> e2ec2cf (initial commit)
      question: q.question,
      options: [
        { id: 'true', text: 'Vrai' },
        { id: 'false', text: 'Faux' },
      ],
      correctAnswer: q.answer ? 'true' : 'false',
      feedbackCorrect: 'Correct !',
      feedbackWrong: 'Faux !',
    }));

<<<<<<< HEAD
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
=======
    this.#allQuestions = [...qcmQuestions, ...normalizedSimpleQuestions];
    this.#currentQuestion = Phaser.Utils.Array.GetRandom(this.#allQuestions);
    this.#isQcm = this.#currentQuestion.type !== 'true_false';

    // Dark overlay
    this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.5).setOrigin(0);

    if (this.#isQcm) {
      this.#buildQcmDialog();
    } else {
      this.#buildTrueFalseDialog();
    }

    if (!this.input.keyboard) {
      throw new Error('Keyboard input is required for QuizScene');
    }
    this.#controls = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
>>>>>>> e2ec2cf (initial commit)
      enter: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
      space: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    };

    this.#updateCursorPosition();
  }

<<<<<<< HEAD
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
=======
  /** QCM layout: uses the "dialogue qcm.png" image as background */
  #buildQcmDialog(): void {
    const screenCx = this.scale.width / 2;
    const screenCy = this.scale.height / 2;

    // Container centered on screen
    this.#dialogContainer = this.add.container(
      screenCx - QCM_DIALOG.WIDTH / 2,
      screenCy - QCM_DIALOG.HEIGHT / 2,
    );

    // Background image scaled down
    const bg = this.add.image(0, 0, ASSET_KEYS.UI_DIALOG_QCM).setOrigin(0);
    bg.setDisplaySize(QCM_DIALOG.WIDTH, QCM_DIALOG.HEIGHT);
    this.#dialogContainer.add(bg);

    // Question text — centered inside the beige rectangle
    this.#questionText = this.add
      .text(QCM_DIALOG.QUESTION_X, QCM_DIALOG.QUESTION_CY, this.#currentQuestion.question, {
        ...DEFAULT_UI_TEXT_STYLE,
        fontSize: 6,
        wordWrap: { width: QCM_DIALOG.QUESTION_W },
        align: 'center',
        color: '#3B1F00',
      })
      .setOrigin(0.5, 0.5);
    this.#dialogContainer.add(this.#questionText);

    // Answer texts — one per answer box
    const options = this.#currentQuestion.options || [];
    options.forEach((option, index) => {
      const box = QCM_DIALOG.ANSWERS[index];
      if (!box) return;
      const optionText = this.add
        .text(box.cx, box.cy, option.text, {
          ...DEFAULT_UI_TEXT_STYLE,
          fontSize: 6,
          wordWrap: { width: QCM_DIALOG.ANSWER_W },
          align: 'center',
          color: '#FFFFFF',
        })
        .setOrigin(0.5, 0.5);
      this.#optionTexts.push(optionText);
      this.#dialogContainer.add(optionText);
    });

    // Cursor
    this.#cursor = this.add.image(0, 0, ASSET_KEYS.UI_CURSOR).setOrigin(0.5).setScale(0.6);
    this.#dialogContainer.add(this.#cursor);
  }

  /** True/False layout: uses "dialogue true false.png" */
  #buildTrueFalseDialog(): void {
    const screenCx = this.scale.width / 2;
    const screenCy = this.scale.height / 2;

    this.#dialogContainer = this.add.container(
      screenCx - TF_DIALOG.WIDTH / 2,
      screenCy - TF_DIALOG.HEIGHT / 2,
    );

    const bg = this.add.image(0, 0, ASSET_KEYS.UI_DIALOG_TF).setOrigin(0);
    bg.setDisplaySize(TF_DIALOG.WIDTH, TF_DIALOG.HEIGHT);
    this.#dialogContainer.add(bg);

    // Question text — centered in the white/cream rectangle
    this.#questionText = this.add
      .text(TF_DIALOG.QUESTION_X, TF_DIALOG.QUESTION_CY, this.#currentQuestion.question, {
        ...DEFAULT_UI_TEXT_STYLE,
        fontSize: 6,
        wordWrap: { width: TF_DIALOG.QUESTION_W },
        align: 'center',
        color: '#3B1F00',
      })
      .setOrigin(0.5, 0.5);
    this.#dialogContainer.add(this.#questionText);

    // Vrai (green, left) and Faux (red, right) — side by side
    const options = this.#currentQuestion.options || [];
    options.forEach((option, index) => {
      const box = TF_DIALOG.ANSWERS[index];
      if (!box) return;
      const optionText = this.add
        .text(box.cx, box.cy, option.text, {
          ...DEFAULT_UI_TEXT_STYLE,
          fontSize: 6,
          wordWrap: { width: box.w },
          align: 'center',
          color: '#FFFFFF',
        })
        .setOrigin(0.5, 0.5);
      this.#optionTexts.push(optionText);
      this.#dialogContainer.add(optionText);
    });

    this.#cursor = this.add.image(0, 0, ASSET_KEYS.UI_CURSOR).setOrigin(0.5).setScale(0.6);
    this.#dialogContainer.add(this.#cursor);
  }

  public update(): void {
    if (!this.input.keyboard) return;

    if (this.#isQcm) {
      // QCM: navigate up/down
      if (Phaser.Input.Keyboard.JustDown(this.#controls.up)) {
        this.#selectedOptionIndex =
          (this.#selectedOptionIndex - 1 + this.#optionTexts.length) % this.#optionTexts.length;
        this.#updateCursorPosition();
      } else if (Phaser.Input.Keyboard.JustDown(this.#controls.down)) {
        this.#selectedOptionIndex = (this.#selectedOptionIndex + 1) % this.#optionTexts.length;
        this.#updateCursorPosition();
      }
    } else {
      // True/False: navigate left/right (also accept up/down)
      if (
        Phaser.Input.Keyboard.JustDown(this.#controls.left) ||
        Phaser.Input.Keyboard.JustDown(this.#controls.up)
      ) {
        this.#selectedOptionIndex =
          (this.#selectedOptionIndex - 1 + this.#optionTexts.length) % this.#optionTexts.length;
        this.#updateCursorPosition();
      } else if (
        Phaser.Input.Keyboard.JustDown(this.#controls.right) ||
        Phaser.Input.Keyboard.JustDown(this.#controls.down)
      ) {
        this.#selectedOptionIndex = (this.#selectedOptionIndex + 1) % this.#optionTexts.length;
        this.#updateCursorPosition();
      }
    }

    if (
      Phaser.Input.Keyboard.JustDown(this.#controls.enter) ||
      Phaser.Input.Keyboard.JustDown(this.#controls.space)
    ) {
>>>>>>> e2ec2cf (initial commit)
      this.#handleAnswer();
    }
  }

  #updateCursorPosition(): void {
    if (this.#optionTexts.length === 0) return;
    const selectedText = this.#optionTexts[this.#selectedOptionIndex];
<<<<<<< HEAD
    this.#cursor.setX(selectedText.x - 10);
    this.#cursor.setY(selectedText.y + 8);
  }

  #handleAnswer(): void {
    if (this.#optionTexts.length === 0 || !this.#cursor.visible) {
      return;
    }
=======
    if (this.#isQcm) {
      // QCM: cursor to the left of the answer box
      this.#cursor.setX(selectedText.x - QCM_DIALOG.ANSWER_W / 2 - 8);
      this.#cursor.setY(selectedText.y);
    } else {
      // TF: cursor above the selected box (green or red)
      this.#cursor.setX(selectedText.x);
      this.#cursor.setY(selectedText.y - 12);
    }
  }

  #handleAnswer(): void {
    if (this.#optionTexts.length === 0 || !this.#cursor.visible) return;
>>>>>>> e2ec2cf (initial commit)

    const options = this.#currentQuestion.options || [];
    const selectedOption = options[this.#selectedOptionIndex];
    const isCorrect = selectedOption.id === this.#currentQuestion.correctAnswer;
<<<<<<< HEAD
    
    // Feedback text
    const feedback = isCorrect 
      ? (this.#currentQuestion.feedbackCorrect || 'Correct !') 
      : (this.#currentQuestion.feedbackWrong || 'Faux !');
      
    this.#questionText.setText(feedback);
    this.#optionTexts.forEach(t => t.visible = false);
    this.#cursor.visible = false;
=======

    const feedback = isCorrect
      ? this.#currentQuestion.feedbackCorrect || 'Correct !'
      : this.#currentQuestion.feedbackWrong || 'Faux !';

    this.#questionText.setText(feedback).setOrigin(0.5, 0.5);
    if (this.#isQcm) {
      this.#questionText.setPosition(QCM_DIALOG.QUESTION_X, QCM_DIALOG.QUESTION_CY);
    } else {
      this.#questionText.setPosition(TF_DIALOG.QUESTION_X, TF_DIALOG.QUESTION_CY);
    }
    this.#optionTexts.forEach((t) => t.setVisible(false));
    this.#cursor.setVisible(false);
>>>>>>> e2ec2cf (initial commit)

    this.time.delayedCall(2000, () => {
      EVENT_BUS.emit(CUSTOM_EVENTS.QUIZ_RESULT, { correct: isCorrect });
      this.scene.stop();
    });
  }
}
