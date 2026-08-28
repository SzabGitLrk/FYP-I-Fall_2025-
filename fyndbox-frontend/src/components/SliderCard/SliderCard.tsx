import { FC } from 'react';
import { CardContainer, StepCounter, StepTitle, StepDescription } from './SliderCard.style';

interface SliderCardProps {
  title: string;
  description: string;
  step: number;
}

const SliderCard: FC<SliderCardProps> = ({ title, description, step }) => {
  return (
    <CardContainer>
      <StepCounter>
        {step}
      </StepCounter>
      <StepTitle>
        {title}
      </StepTitle>
      <StepDescription>
        {description}
      </StepDescription>
    </CardContainer>
  );
};

export default SliderCard;
