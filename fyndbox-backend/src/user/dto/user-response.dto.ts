export class UserResponseDto {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly isActive: boolean;
  readonly image?: string;
}
